import {FC, useState} from 'react'
import {ConfirmModal, ConfirmModalProps} from 'decky-frontend-lib'
import {WidgetPosition} from "./overlaid"
import SliderTextInput from "./SliderTextInput"

const RepositionWidgetModal: FC<ConfirmModalProps & {
    onReposition?: (position: WidgetPosition) => void,
    position: WidgetPosition,
}> = ({onReposition, position, ...props}) => {

    const [width, setWidth] = useState(position.width)
    const [height, setHeight] = useState(position.height)
    const [x, setX] = useState(position.x_offset)
    const [y, setY] = useState(position.y_offset)
    const [horizontalAnchor, setHorizontalAnchor] = useState(position.horizontal_anchor)
    const [verticalAnchor, setVerticalAnchor] = useState(position.vertical_anchor)

    return (
        <ConfirmModal
            {...props}
            strTitle="Reposition Widget"
            onOK={() => onReposition?.({
                width: width,
                height: height,
                x_offset: x,
                y_offset: y,
                horizontal_anchor: horizontalAnchor,
                vertical_anchor: verticalAnchor,
            })}
        >
            <SliderTextInput label="Width" labelWidth="11%" value={width} min={0} max={800} step={50} integer={true} onChange={setWidth}/>
            <SliderTextInput label="Height" labelWidth="11%" value={height} min={0} max={1280} step={50} integer={true} onChange={setHeight}/>
            <SliderTextInput label="X Offset" labelWidth="11%" value={x} min={-800} max={800} step={100} integer={true} onChange={setX}/>
            <SliderTextInput label="Y Offset" labelWidth="11%" value={y} min={-1280} max={1280} step={100} integer={true} onChange={setY}/>
            <SliderTextInput label="Horizontal Anchor" labelWidth="23%" value={horizontalAnchor} min={0} max={1} step={0.1} integer={false} onChange={setHorizontalAnchor}/>
            <SliderTextInput label="Vertical Anchor" labelWidth="23%" value={verticalAnchor} min={0} max={1} step={0.1} integer={false} onChange={setVerticalAnchor}/>
        </ConfirmModal>
    )
}

export default RepositionWidgetModal
