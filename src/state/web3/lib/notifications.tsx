import toast from 'react-hot-toast'
import Notification from 'components/notification'
import { AlertCircle, Check } from 'react-feather'

export const success = (title: string, subtitle: string, duration: number = 1000) => {
    toast(
        (t) => (
            <Notification
                title={title}
                subtitle={subtitle}
                toastId={t.id}
                icon={<Check />}
            />
        ),
        { duration: duration }
    )
}

export const signed = (title: string = "Transaction Signed!", duration: number = 1000) => {
    toast(
        (t) => (
            <Notification
                title={title}
                toastId={t.id}
                icon={<Check />}
            />
        ),
        { duration: duration }
    )
}

export const error = (title: string, subtitle: string) => {
    toast((t) => (
        <Notification
            title={title}
            subtitle={subtitle}
            toastId={t.id}
            icon={<AlertCircle stroke="var(--theme-ui-colors-text" />}
        />
    ))
}
