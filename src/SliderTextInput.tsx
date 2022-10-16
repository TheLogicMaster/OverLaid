import {FC, useEffect, useState} from 'react'
import {Focusable, SliderField, TextField} from 'decky-frontend-lib'

const SliderTextInput: FC<{
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    integer: boolean,
    labelWidth: string,
    onChange?: (value: number) => void
}> = ({label, value, min, max, step, integer, labelWidth, onChange}) => {

    const [text, setText] = useState(value.toString())

    useEffect(() => {
        if (text !== value.toString())
            setText(value.toString())
    }, [value])

    return (
        <Focusable style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
            <div style={{
                flex: "1",
                marginLeft: "20px",
                marginRight: "30px",
            }}>
                <SliderField
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={value => onChange?.(integer ? Math.floor(value) : value)}
                />
            </div>

            <div style={{width: labelWidth}}>{label}</div>

            <TextField
                style={{width: "64px", marginLeft: "10px"}}
                value={text}
                mustBeNumeric={true}
                rangeMin={min}
                rangeMax={max}
                onChange={event => {
                    setText(event.target.value)
                    const value = +event.target.value
                    if (!Number.isNaN(value))
                        onChange?.(integer ? Math.floor(value) : value)
                }}
            />
        </Focusable>
    )
}

export default SliderTextInput
