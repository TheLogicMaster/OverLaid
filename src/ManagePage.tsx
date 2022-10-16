import {
    Dropdown,
    DropdownOption,
    TextField,
    PanelSection,
    PanelSectionRow,
    showModal,
    staticClasses, ConfirmModal, ColorPickerModal, Focusable, DialogButton,
} from "decky-frontend-lib"
import {createRef, FC, useEffect, useReducer, useState} from "react"
import {Overlay, ServerAPIProviderType} from "./overlaid"
import NewWidgetModal from "./NewWidgetModal"
import NewOverlayModal from "./NewOverlayModal"
import TintedImage from "./TintedImage"
import RepositionWidgetModal from "./RepositionWidgetModal"
import {FaImage} from "react-icons/fa"

let overlays: Overlay[] = []

const ManagePage: FC<ServerAPIProviderType> = ({serverAPI}) => {
    const [overlayOptions, setOverlayOptions] = useState<DropdownOption[]>([])
    const [overlaySelection, setOverlaySelection] = useState<number | null>(null)
    const [currentOverlay, setCurrentOverlay] = useState<Overlay | null>(null)
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const previewRef = createRef<HTMLDivElement>()
    const [previewSize, setPreviewSize] = useState({width: 0, height: 0})
    const [images, setImages] = useState({})

    const changeOverlay = (index: number) => {
        setOverlayOptions(overlays.map((overlay, index) => ({label: overlay.name, data: index})))
        setOverlaySelection(overlays.length > 0 ? index : null)
        setCurrentOverlay(overlays.length > 0 ? overlays[index] : null)
    }

    const changeToNamedOverlayIfPresent = (overlayName: string) => {
        let found = false
        overlays.forEach((overlay, index) => {
            if (overlay.name === overlayName) {
                changeOverlay(index)
                found = true
            }
        })
        return found
    }

    const reload = async () => {
        const current = currentOverlay?.name
        const reloadResult = await serverAPI.callPluginMethod('reload_config', {})
        if (!reloadResult.success)
            await showError(reloadResult.result)
        const result = await serverAPI.callPluginMethod<{}, { overlays: Overlay[] }>("get_overlays", {})
        if (result.success) {
            overlays = result.result.overlays
            if (!current || !changeToNamedOverlayIfPresent(current))
                changeOverlay(0)
        } else
            await showError(result.result)
        const imageResult = await serverAPI.callPluginMethod('get_images', {})
        if (imageResult.success)
            setImages(imageResult.result)
        else
            await showError(imageResult.result)
        forceUpdate()
    }

    const showError = async (msg: string) => {
        await showModal(
            <ConfirmModal bAlertDialog={true}>
                <div className={staticClasses.Title} style={{flexDirection: "column", boxShadow: "unset"}}>
                    OverLaid Error
                </div>
                <div className={staticClasses.Text}>
                    {msg}
                </div>
            </ConfirmModal>, window
        )
    }

    const hslaToRgb = (hsla: string) => {
        let result = /^hsla\((.+),(.+)%,(.+)%,(.+)\)$/.exec(hsla)
        if (!result)
            return [0, 0, 0, 0]
        const h = +result[1], s = +result[2] / 100, l = +result[3] / 100, a = +result[4]
        const v = s * Math.min(l, 1 - l)
        const f = (n: number, k = (n + h / 30) % 12) => l - v * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return [f(0), f(8), f(4), a]
    }

    // Based on: https://stackoverflow.com/questions/2348597/why-doesnt-this-javascript-rgb-to-hsl-code-work/54071699#54071699
    const rgbToHsl = (rgb: number[]) => {
        const r = rgb[0], g = rgb[1], b = rgb[2]
        const v = Math.max(r, g, b)
        const c = v - Math.min(r, g, b)
        const f = 1 - Math.abs(v + v - c - 1)
        const h = c && (v == r ? (g - b) / c : (v == g ? 2 + (b - r) / c : 4 + (r - g) / c))
        return [60 * (h < 0 ? h + 6 : h), f ? c / f * 100 : 0, (v + v - c) / 2 * 100]
    }

    const rgbaToString = (color: number[], useAlpha: boolean = true) => {
        return (useAlpha ? "rgba(" : "rgb(") +
            Math.round(color[0] * 255) + "," +
            Math.round(color[1] * 255) + "," +
            Math.round(color[2] * 255) +
            (useAlpha ? "," + color[3] : "") + ")"
    }

    useEffect(() => {
        reload()
        if (previewRef.current)
            setPreviewSize({
                width: previewRef.current.clientWidth,
                height: previewRef.current.clientHeight,
            })
    }, [])

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "100%",
            alignItems: "stretch"
        }}>
            <div style={{flex: 1, position: "relative"}}>
                <div ref={previewRef} style={{
                    width: "100%",
                    paddingBottom: "62.5%",
                    background: "#0e141b",
                    borderStyle: "solid",
                    borderWidth: "2px",
                    borderColor: "#3d4450",
                }}>
                    {currentOverlay && <>
                        {currentOverlay.widgets.map(widget => <div style={{
                            position: "absolute",
                            width: Math.floor(previewSize.width / 1280 * widget.width) + 'px',
                            height: Math.floor(previewSize.height / 800 * widget.height) + 'px',
                            left: Math.floor(previewSize.width * widget.horizontal_anchor + previewSize.width / 1280 * widget.x_offset) + 'px',
                            top: Math.floor(previewSize.height * widget.vertical_anchor + previewSize.height / 800 * widget.y_offset) + 'px',
                            color: rgbaToString(widget.color),
                            background: rgbaToString(widget.bg_color),
                        }}>
                            {(widget.type === 'image' && images[widget.content] && <TintedImage
                                src={images[widget.content]}
                                color={rgbaToString(widget.color)}
                                style={{width: "100%", height: "100%"}}
                            />) || (widget.type === 'text' && <div style={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                height: "100%",
                                fontSize: "xx-small",
                            }}>
                                {widget.content}
                            </div>) || <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                                outline: "1px solid #434955",
                            }}>
                                <FaImage/>
                            </div>}
                        </div>)}
                    </>}
                </div>
            </div>

            <div style={{
                overflow: "scroll",
                width: "300px",
                background: "#0e141b",
                padding: "10px",
                marginLeft: "10px",
                borderStyle: "solid",
                borderWidth: "2px",
                borderColor: "#3d4450",
            }}>
                <PanelSection title="Options">
                    <PanelSectionRow>
                        <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                            reload()
                        }}>
                            Reload Overlays
                        </DialogButton>
                    </PanelSectionRow>

                    <PanelSectionRow>
                        <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                            showModal(<NewOverlayModal
                                overlays={overlays}
                                onAdd={overlayName => (async () => {
                                    if (overlays.find(overlay => overlay.name === overlayName) !== undefined) {
                                        await showError("Overlay with same name already exists")
                                        return
                                    }
                                    const result = await serverAPI.callPluginMethod("save_overlay", {
                                        overlay: {
                                            name: overlayName,
                                            widgets: []
                                        }
                                    })
                                    if (!result.success)
                                        await showError(result.result)
                                    await reload()
                                    changeToNamedOverlayIfPresent(overlayName)
                                })()}
                            />, window)
                        }}>
                            New Overlay
                        </DialogButton>
                    </PanelSectionRow>

                    <PanelSectionRow>
                        <Dropdown
                            menuLabel="Overlay"
                            rgOptions={overlayOptions}
                            selectedOption={overlaySelection}
                            onChange={option => {
                                changeOverlay(option.data)
                            }}
                        />
                    </PanelSectionRow>
                </PanelSection>

                {currentOverlay &&
                    <>
                        <PanelSection title="Overlay">
                            <PanelSectionRow>
                                <form style={{flex: 1, padding: "0px"}}>
                                    <TextField
                                        value={currentOverlay.name}
                                        label="Name"
                                        onChange={event => {
                                            currentOverlay.name = event.target.value
                                            forceUpdate()
                                        }}
                                    />
                                </form>
                            </PanelSectionRow>

                            <PanelSectionRow>
                                <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                                    showModal(
                                        <ConfirmModal
                                            strOKButtonText="Save"
                                            onOK={() => (async () => {
                                                const result = await serverAPI.callPluginMethod("save_overlay", {overlay: currentOverlay})
                                                if (!result.success)
                                                    await showError(result.result)
                                                await reload()
                                            })()}
                                        >
                                            <div className={staticClasses.Title} style={{flexDirection: "column", boxShadow: "unset"}}>
                                                Save Overlay?
                                            </div>
                                        </ConfirmModal>, window
                                    )
                                }}>
                                    Save Overlay
                                </DialogButton>
                            </PanelSectionRow>

                            <PanelSectionRow>
                                <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                                    showModal(
                                        <ConfirmModal
                                            onOK={() => (async () => {
                                                const result = await serverAPI.callPluginMethod("delete_overlay", {overlay: currentOverlay})
                                                if (!result.success)
                                                    await showError(result.result)
                                                await reload()
                                            })()}
                                        >
                                            <div className={staticClasses.Title} style={{flexDirection: "column", boxShadow: "unset"}}>
                                                Delete Overlay
                                            </div>
                                            Are you sure that you want to delete this overlay? This cannot be undone.
                                        </ConfirmModal>, window
                                    )
                                }}>
                                    Delete Overlay
                                </DialogButton>
                            </PanelSectionRow>

                            <PanelSectionRow>
                                <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                                    showModal(<NewWidgetModal onAdd={type => {
                                        currentOverlay.widgets.push({
                                            id: ("" + Math.random()).substring(2),
                                            type: type,
                                            content: "",
                                            width: 100,
                                            height: 100,
                                            vertical_anchor: 0,
                                            horizontal_anchor: 0,
                                            x_offset: 0,
                                            y_offset: 0,
                                            color: [1, 1, 1, 1],
                                            bg_color: [0, 0, 0, 0]
                                        })
                                        forceUpdate()
                                    }}/>, window)
                                }}>
                                    Add Widget
                                </DialogButton>
                            </PanelSectionRow>
                        </PanelSection>

                        {currentOverlay.widgets.map((widget) => <PanelSection
                            title={widget.type + " widget"}
                        >
                            <PanelSectionRow>
                                {widget.type === "text" ?
                                    <form style={{flex: 1, padding: "0px"}}>
                                        <TextField
                                            value={widget.content}
                                            onChange={event => {
                                                widget.content = event.target.value
                                                forceUpdate()
                                            }}
                                        />
                                    </form>
                                    :
                                    <DialogButton
                                        style={{marginTop: "5px", marginBottom: "5px", minHeight: "40px", overflowWrap: "break-word"}}
                                        onClick={() => serverAPI.openFilePicker("/home/deck/homebrew/overlays", true,
                                            new RegExp("^(?:([^.]+\\.(?:png|jpe?g))|([^.]+(?!\\.)))$", "i")).then(result => {
                                            const root = "/home/deck/homebrew/overlays/" + currentOverlay.name + "/"
                                            widget.content = result.realpath.startsWith(root) ? result.realpath.substring(root.length) : result.realpath
                                            forceUpdate()
                                        }, () => null)}
                                    >
                                        {widget.content.length > 0 ? widget.content : "Image Not Set"}
                                    </DialogButton>
                                }
                            </PanelSectionRow>

                            <PanelSectionRow>
                                <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                                    showModal(<RepositionWidgetModal position={widget} onReposition={position => {
                                        Object.assign(widget, position)
                                        forceUpdate()
                                    }}/>, window)
                                }}>
                                    Reposition
                                </DialogButton>
                            </PanelSectionRow>

                            <PanelSectionRow>
                                <Focusable style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    padding: "0px",
                                    marginTop: "5px",
                                    marginBottom: "5px"
                                }}>
                                    <DialogButton
                                        style={{minWidth: "100px", height: "40px", marginRight: "5px", color: rgbaToString(widget.color, false)}}
                                        onClick={() => {
                                            showModal(<ColorPickerModal
                                                closeModal={() => null}
                                                defaultH={rgbToHsl(widget.color)[0]}
                                                defaultS={rgbToHsl(widget.color)[1]}
                                                defaultL={rgbToHsl(widget.color)[2]}
                                                defaultA={widget.color[3]}
                                                onConfirm={hsla => {
                                                    widget.color = hslaToRgb(hsla)
                                                    forceUpdate()
                                                }}/>, window)
                                        }}>
                                        Color
                                    </DialogButton>

                                    <DialogButton
                                        style={{minWidth: "100px", height: "40px", color: rgbaToString(widget.bg_color, false)}}
                                        onClick={() => {
                                            showModal(<ColorPickerModal
                                                closeModal={() => null}
                                                defaultH={rgbToHsl(widget.bg_color)[0]}
                                                defaultS={rgbToHsl(widget.bg_color)[1]}
                                                defaultL={rgbToHsl(widget.bg_color)[2]}
                                                defaultA={widget.bg_color[3]}
                                                onConfirm={hsla => {
                                                    widget.bg_color = hslaToRgb(hsla)
                                                    forceUpdate()
                                                }}/>, window)
                                        }}>
                                        BG Color
                                    </DialogButton>
                                </Focusable>
                            </PanelSectionRow>

                            <PanelSectionRow>
                                <DialogButton style={{marginTop: "5px", marginBottom: "5px"}} onClick={() => {
                                    showModal(
                                        <ConfirmModal
                                            onOK={() => {
                                                currentOverlay.widgets = currentOverlay.widgets.filter(w => w.id != widget.id)
                                                forceUpdate()
                                            }}
                                        >
                                            <div className={staticClasses.Title} style={{flexDirection: "column", boxShadow: "unset"}}>
                                                Delete Widget
                                            </div>
                                            Are you sure you want to delete this widget?
                                        </ConfirmModal>, window
                                    )
                                }}>
                                    Delete Widget
                                </DialogButton>
                            </PanelSectionRow>
                        </PanelSection>)}
                    </>
                }
            </div>
        </div>
    )
}

export default ManagePage
