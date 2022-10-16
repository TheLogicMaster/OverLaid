import {FC} from "react"

const AboutPage: FC = () => {
    return (
        <div>
            <h2 style={{fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px"}}>
                Info
            </h2>
            <span>
                This plugin allows creating custom in-game overlays using the built-in overlay manager.
                Quickly enable and disable overlays from the Quick Access Menu. Each overlay has a list
                of widgets that can be individually manipulated. Text widgets show a textbox and image
                widgets show a local image. Widgets can be stored anywhere, but are more convenient to
                access in the ~/homebrew/overlays overlay directories. For positioning widgets, there
                is both anchoring, to "anchor" the origin of a widget with respect to display percentages,
                and coordinate offsets to adjust the relative positioning of said widget. The color of
                the text and image tint can be tweaked as well as the widget background color/opacity.
                See the plugin repository's README for manual usage instructions.
            </span>

            <h2 style={{fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px"}}>
                Developer
            </h2>
            <span>TheLogicMaster - github.com/TheLogicMaster/OverLaid</span>

            <h2 style={{fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px"}}>
                Support
            </h2>
            <span>
                See the Steam Deck Homebrew Discord server for support: discord.gg/ZU74G2NJzk
            </span>
        </div>
    )
}

export default AboutPage
