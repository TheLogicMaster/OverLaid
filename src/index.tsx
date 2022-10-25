import {
    ButtonItem,
    definePlugin,
    PanelSection,
    PanelSectionRow,
    ServerAPI,
    staticClasses,
    ToggleField,
    Router,
    Tabs,
    useQuickAccessVisible
} from "decky-frontend-lib"
import {useEffect, VFC, useState, FC} from "react"
import {FaBuffer} from "react-icons/fa"
import AboutPage from "./AboutPage"
import ManagePage from "./ManagePage"

declare global {
    interface Window {
        NotificationStore: any
    }
}

let overlaysEnabled = false

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
    const [enabled, setEnabled] = useState({})

    const qamVisible = useQuickAccessVisible()

    const reloadSettings = async () => {
        const result = await serverAPI.callPluginMethod<any, any>('get_settings', {})
        if (result.success)
            setEnabled(result.result.enabled)
    }

    useEffect(() => {
        reloadSettings()
    }, [qamVisible])

    return (
        <>
            <PanelSection>
                <PanelSectionRow>
                    <ToggleField checked={overlaysEnabled} label="Enable" onChange={(checked) => {
                        overlaysEnabled = checked
                    }}/>
                </PanelSectionRow>
            </PanelSection>

            <PanelSection title="Overlays">
                {Object.keys(enabled).map((property) => <PanelSectionRow>
                    <ToggleField
                        checked={enabled[property]}
                        label={property}
                        onChange={(checked) => (async () => {
                            let entry = {}
                            entry[property] = checked
                            await serverAPI.callPluginMethod<any, any>('save_settings', {settings: {enabled: {...enabled, ...entry}}})
                            await reloadSettings()
                        })()}
                    />
                </PanelSectionRow>)}
            </PanelSection>

            <PanelSection title="Options">
                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => {
                            Router.CloseSideMenus()
                            Router.Navigate("/overlaid-manage")
                        }}
                    >
                        Manage
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem layout="below" onClick={() => (async () => {
                        await serverAPI.callPluginMethod('reload_config', {})
                        await reloadSettings()
                    })()}>
                        Reload Config
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
        </>
    )
}

let serverAPIRef: ServerAPI | null = null

const OverlaidManageRouter: FC = () => {
    const [ currentTabRoute, setCurrentTabRoute ] = useState<string>("ManageOverlays")

    return (
        <div
            style={{
            marginTop: "40px",
            height: "calc(100% - 40px)",
            background: "#0005",
            }}
        >
            <Tabs
            // @ts-ignore
            title="Animation Manager"
            activeTab={currentTabRoute}
            onShowTab={(tabID: string) => {
                setCurrentTabRoute(tabID)
            }}
            tabs={[
                {
                    title: "Manage Overlays",
                    content: <ManagePage serverAPI={serverAPIRef as ServerAPI}/>,
                    id: "ManageOverlays",
                },
                {
                    title: "About OverLaid",
                    content: <AboutPage />,
                    id: "AboutOverLaid",
                }
            ]}
            />
        </div>
    )
}

export default definePlugin((serverApi: ServerAPI) => {
    serverAPIRef = serverApi

    serverApi.routerHook.addRoute("/overlaid-manage", OverlaidManageRouter, {
        exact: true,
    })

    let shown = false

    const timer = setInterval(() => {
        const shouldShow = overlaysEnabled && window.NotificationStore.BIsUserInGame() && (Router as Router & { m_eOpenSideMenu: number }).m_eOpenSideMenu === 0
        if (shouldShow != shown) {
            serverApi.callPluginMethod<any, any>(shouldShow ? 'create' : 'destroy', {})
            shown = shouldShow
        }
    }, 100)

    return {
        title: <div className={staticClasses.Title}>OverLaid</div>,
        content: <Content serverAPI={serverApi}/>,
        icon: <FaBuffer/>,
        alwaysRender: true,
        onDismount() {
            clearInterval(timer)
            serverApi.callPluginMethod<any, any>('destroy', {})
            serverApi.routerHook.removeRoute("/overlaid-manage")
        },
    }
})
