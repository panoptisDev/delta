import styled from '@emotion/styled'
import { Options, Placement } from '@popperjs/core'
import Portal from '@reach/portal'
import useOnClickOutside from 'hooks/useOnClickOutside'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
import useInterval from '../../hooks/useInterval'

const PopoverContainer = styled.div<{ show: boolean }>`
  z-index: 100010;
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.show ? 1 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;
`
// color: ${({ theme }) => theme.text2};

const ReferenceElement = styled.div`
  display: inline-block;
`

// border: 1px solid ${({ theme }) => theme.bg2};
// background: ${({ theme }) => theme.bg0};
const Arrow = styled.div`
  width: 8px;
  height: 8px;
  z-index: 100010;
  ::before {
    position: absolute;
    width: 8px;
    height: 8px;
    z-index: 9998;
    content: '';
    border: 1px solid black;
    transform: rotate(45deg);
    background: white;
  }
  &.arrow-top {
    bottom: -5px;
    ::before {
      border-top: none;
      border-left: none;
    }
  }
  &.arrow-bottom {
    top: -5px;
    ::before {
      border-bottom: none;
      border-right: none;
    }
  }
  &.arrow-left {
    right: -5px;
    ::before {
      border-bottom: none;
      border-left: none;
    }
  }
  &.arrow-right {
    left: -5px;
    ::before {
      border-right: none;
      border-top: none;
    }
  }
`

export interface PopoverProps {
  content: React.ReactNode
  show: boolean
  children: React.ReactNode
  placement?: Placement
  arrow?: boolean
  onDismiss?: () => void
}

export default function Popover({
  content,
  show,
  children,
  placement = 'auto',
  arrow = false,
  onDismiss = undefined,
}: PopoverProps) {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null)
  const popperElement = useRef<HTMLDivElement>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)

  const options = useMemo(
    (): Options => ({
      placement,
      strategy: 'fixed',
      modifiers: [
        { name: 'offset', options: { offset: [8, 8] } },
        { name: 'arrow', options: { element: arrowElement } },
        { name: 'preventOverflow', options: { padding: 8 } },
      ],
    }),
    [arrowElement, placement]
  )

  const handleDismiss = (event: TouchEvent | MouseEvent) => {
    if(referenceElement?.contains(event.target as Node)) {
      return
    }

    return onDismiss && onDismiss()
  }

  // Only applicable if onDismiss is send
  useOnClickOutside(popperElement, handleDismiss)

  const { styles, update, attributes } = usePopper(
    referenceElement,
    popperElement.current,
    options
  )

  const updateCallback = useCallback(() => {
    if(update) {
      update()
    }
  }, [update])
  useInterval(updateCallback, show ? 200 : null)

  useEffect(() => {
    if(show) {
      updateCallback()
    }
  }, [show])

  return (
    <>
      <ReferenceElement ref={setReferenceElement as any}>
        {children}
      </ReferenceElement>
      <Portal>
        <PopoverContainer
          show={show}
          ref={popperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          {content}
          {arrow && (
            <Arrow
              className={`arrow-${
                attributes.popper?.['data-popper-placement'] ?? ''
              }`}
              ref={setArrowElement as any}
              style={styles.arrow}
              {...attributes.arrow}
            />
          )}
        </PopoverContainer>
      </Portal>
    </>
  )
}
