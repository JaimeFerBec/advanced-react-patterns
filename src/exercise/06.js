// Control Props
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {Switch} from '../switch'
import warning from 'warning'

const isDevMode = process.env.NODE_ENV !== 'production'

function useOnChangeWarning({propName, propValue, onChange, componentName}) {
  const isControlled = propValue != null
  const {current: wasControlled} = React.useRef(isControlled)

  React.useEffect(() => {
    warning(!(isControlled && !onChange),
      `Failed prop type: You provided a \`${propName}\` prop to a \`${componentName}\` field without an \`onChange\` handler. This will render a read-only field. If the field should be mutable set \`onChange\`.`,
    )
  }, [isControlled, onChange, propName, componentName])
}

function useControlledSwitchWarning({propName, propValue, componentName}) {
  const isControlled = propValue != null
  const {current: wasControlled} = React.useRef(isControlled)

  React.useEffect(() => {
    warning(!(wasControlled && !isControlled),
      `\`${componentName}\` is changing a controlled input (\`${propName}\`) to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components`,
    )
    warning(!(!wasControlled && isControlled),
      `\`${componentName}\` is changing an uncontrolled input (\`${propName}\`) to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components`,
    )
  }, [isControlled, wasControlled, propName, componentName])
}

const callAll = (...fns) => (...args) => fns.forEach(fn => fn?.(...args))

const actionTypes = {
  toggle: 'toggle',
  reset: 'reset',
}

function toggleReducer(state, {type, initialState}) {
  switch (type) {
    case actionTypes.toggle: {
      return {on: !state.on}
    }
    case actionTypes.reset: {
      return initialState
    }
    default: {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
}

function useToggle({
  initialOn = false,
  reducer = toggleReducer,
  // 🐨 add an `onChange` prop.
  onChange,
  // 🐨 add an `on` option here
  // 💰 you can alias it to `controlledOn` to avoid "variable shadowing."
  on: controlledOn,
} = {}) {
  const {current: initialState} = React.useRef({on: initialOn})
  const [state, dispatch] = React.useReducer(reducer, initialState)

  if (isDevMode) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOnChangeWarning({
      propName: 'on',
      propValue: controlledOn,
      onChange,
      componentName: 'useToggle',
    })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useControlledSwitchWarning({
      propName: 'on',
      propValue: controlledOn,
      componentName: 'useToggle',
    })
  }

  // 🐨 determine whether on is controlled and assign that to `onIsControlled`
  // 💰 `controlledOn != null`
  const onIsControlled = controlledOn != null

  // 🐨 Replace the next line with `const on = ...` which should be `controlledOn` if
  // `onIsControlled`, otherwise, it should be `state.on`.
  const on = onIsControlled ? controlledOn : state.on

  // We want to call `onChange` any time we need to make a state change, but we
  // only want to call `dispatch` if `!onIsControlled` (otherwise we could get
  // unnecessary renders).
  // 🐨 To simplify things a bit, let's make a `dispatchWithOnChange` function
  // right here. This will:
  // 1. accept an action
  // 2. if onIsControlled is false, call dispatch with that action
  // 3. Then call `onChange` with our "suggested changes" and the action.
  // 🦉 "Suggested changes" refers to: the changes we would make if we were
  // managing the state ourselves. This is similar to how a controlled <input />
  // `onChange` callback works. When your handler is called, you get an event
  // which has information about the value input that _would_ be set to if that
  // state were managed internally.
  // So how do we determine our suggested changes? What code do we have to
  // calculate the changes based on the `action` we have here? That's right!
  // The reducer! So if we pass it the current state and the action, then it
  // should return these "suggested changes!"
  //
  // 💰 Sorry if Olivia the Owl is cryptic. Here's what you need to do for that onChange call:
  // `onChange(reducer({...state, on}, action), action)`
  // 💰 Also note that user's don't *have* to pass an `onChange` prop (it's not required)
  // so keep that in mind when you call it! How could you avoid calling it if it's not passed?
  const dispatchWithOnChange = (action) => {
    if (!onIsControlled) {
      dispatch(action)
    }
    onChange && onChange(reducer({...state, on}, action), action)
  }


  // make these call `dispatchWithOnChange` instead
  const toggle = () => dispatchWithOnChange({type: actionTypes.toggle})
  const reset = () => dispatchWithOnChange({type: actionTypes.reset, initialState})

  function getTogglerProps({onClick, ...props} = {}) {
    return {
      'aria-pressed': on,
      onClick: callAll(onClick, toggle),
      ...props,
    }
  }

  function getResetterProps({onClick, ...props} = {}) {
    return {
      onClick: callAll(onClick, reset),
      ...props,
    }
  }

  return {
    on,
    reset,
    toggle,
    getTogglerProps,
    getResetterProps,
  }
}

function Toggle({on: controlledOn, onChange}) {
  const {on, getTogglerProps} = useToggle({on: controlledOn, onChange})
  const props = getTogglerProps({on})
  return <Switch {...props} />
}

function App() {
  const [bothOn, setBothOn] = React.useState(false)
  const [testInitiallyControlled, setInitiallyControlled] = React.useState(true)
  const [testInitiallyUncontrolled, setInitiallyUncontrolled] = React.useState(null)
  const [timesClicked, setTimesClicked] = React.useState(0)

  function handleToggleChange(state, action) {
    if (action.type === actionTypes.toggle && timesClicked > 4) {
      return
    }
    setBothOn(state.on)
    setTimesClicked(c => c + 1)
  }

  function handleResetClick() {
    setBothOn(false)
    setTimesClicked(0)
  }

  return (
    <div>
      <div>
        <Toggle on={bothOn} onChange={handleToggleChange} />
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
      {timesClicked > 4 ? (
        <div data-testid="notice">
          Whoa, you clicked too much!
          <br />
        </div>
      ) : (
        <div data-testid="click-count">Click count: {timesClicked}</div>
      )}
      <button onClick={handleResetClick}>Reset</button>
      <hr />
      <div>
        <div>Uncontrolled Toggle:</div>
        <Toggle
          onChange={(...args) =>
            console.info('Uncontrolled Toggle onChange', ...args)
          }
        />
      </div>
      <div>
        <div>Toggle without onChange:</div>
        <Toggle
          on={bothOn}
        />
      </div>
      <div>
        <div>Initially controlled Toggle:</div>
        <button onClick={() => setInitiallyControlled(null)}>Unset</button>
        <Toggle
          on={testInitiallyControlled}
          onChange={(...args) =>
            console.info('Initially controlled Toggle onChange', ...args)
          }
        />
      </div>
      <div>
        <div>Initially uncontrolled Toggle:</div>
        <button onClick={() => setInitiallyUncontrolled(true)}>Set</button>
        <Toggle
          on={testInitiallyUncontrolled}
          onChange={(...args) =>
            console.info('Initially uncontrolled Toggle onChange', ...args)
          }
        />
      </div>
    </div>
  )
}

export default App
// we're adding the Toggle export for tests
export {Toggle}

/*
eslint
  no-unused-vars: "off",
*/
