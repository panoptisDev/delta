import ToastContainer from "components/toaster-container/ToastContainer"
import { HashRouter as Router, Route, Routes } from "react-router-dom"
import Updater from "state/updater"
import Web3Provider from "state/web3"
import LanguageProvider from "./i18n"
import { ThemeProvider } from "theme-ui"
import { ROUTES } from "utils/constants"
import { theme } from "./theme"

import Lend from "views/lend"
import Borrow from "views/borrow"
import Deploy from "views/deploy"
import Home from "views/home"
import Insurance from "views/insurance"
import Issuance from "./views/issuance"
import Layout from "./components/layout"

/**
 * App Entry point - Handles views routing
 *
 * @returns {JSX.Element}
 */
const App = () => (
    <Router>
        <ThemeProvider theme={theme}>
            <LanguageProvider>
                <ToastContainer />
                <Web3Provider>
                    <Updater />
                    <Layout>
                        <Routes>
                            <Route path={ ROUTES.HOME } element={<Home />} />
                            <Route path={ ROUTES.ISSUANCE } element={<Issuance />} />
                            <Route path={ ROUTES.INSURANCE } element={<Insurance />} />
                            <Route path={ ROUTES.LEND } element={<Lend />} />
                            <Route path={ ROUTES.BORROW } element={<Borrow />} />
                            <Route path={ ROUTES.DEPLOY } element={<Deploy />} />
                        </Routes>
                    </Layout>
                </Web3Provider>
            </LanguageProvider>
        </ThemeProvider>
    </Router>
)

export default App
