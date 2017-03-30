class KeyEventListener {

    private static keypressCallbacks;

    private static keyupCallbacks;

    private static keydownCallbacks;

    /**
     *
     * @param type
     * @param key 可以是 数字（keyCode）， 字符串（key 或 code）， 数组（同时添加多个）
     * @param callback
     * @param target
     */
    public static add(type: KeyEventType, key: any, callback, target) {
        let temp = typeof key;
        if (type == null || (key != null && temp != "string" && temp != "number" && (temp != "object" || !key.length)) || typeof callback != "function") return;

        let callbackAndTarget = {
            callback: callback,
            target: target
        };

        let keyArr = temp == "object" ? key : [key];
        for (var i = 0, keyArrLen = keyArr.length; i < keyArrLen; i++) {
            let callbackKey;
            let tempKey = keyArr[i];
            let tempKeyType = typeof tempKey;
            if (tempKey == "" || tempKey == null) {
                callbackKey = "";
            }
            else if (tempKeyType == "string" || tempKeyType == "number") {
                callbackKey = "" + tempKeyType.charAt(0) + tempKey;
            }
            else {
                continue;
            }

            if (type == KeyEventType.KEY_PRESS) {
                if (!KeyEventListener.keypressCallbacks) {
                    document.addEventListener("keypress", KeyEventListener.onKeypress, false);
                    KeyEventListener.keypressCallbacks = {};
                }
                KeyEventListener.keypressCallbacks[callbackKey] = callbackAndTarget;
            }
            else if (type == KeyEventType.KEY_UP) {
                if (!KeyEventListener.keyupCallbacks) {
                    document.addEventListener("keyup", KeyEventListener.onKeyup, false);
                    KeyEventListener.keyupCallbacks = {};
                }
                KeyEventListener.keyupCallbacks[callbackKey] = callbackAndTarget;
            }
            else if (type == KeyEventType.KEY_DOWN) {
                if (!KeyEventListener.keydownCallbacks) {
                    document.addEventListener("keydown", KeyEventListener.onKeydown, false);
                    KeyEventListener.keydownCallbacks = {};
                }
                KeyEventListener.keydownCallbacks[callbackKey] = callbackAndTarget;
            }
        }

    }

    private static onKeypress(event: KeyboardEvent) {
        KeyEventListener.callback(KeyEventListener.keypressCallbacks, event);
    }

    private static onKeyup(event: KeyboardEvent) {
        KeyEventListener.callback(KeyEventListener.keyupCallbacks, event);
    }

    private static onKeydown(event: KeyboardEvent) {
        KeyEventListener.callback(KeyEventListener.keydownCallbacks, event);
    }

    private static callback(callbackMap, event) {
        //keyCode 54
        //code:"Numpad6"
        //key:"6"
        let callbackAndTarget = callbackMap["n" + event.keyCode];
        if (!callbackAndTarget) {
            callbackAndTarget = callbackMap["s" + event.key];
            if (!callbackAndTarget) {
                callbackAndTarget = callbackMap["s" + event.code];
                if (!callbackAndTarget) {
                    callbackAndTarget = callbackMap[""];
                }
            }
        }

        if (callbackAndTarget) {
            callbackAndTarget.callback.call(callbackAndTarget.target, event);
            return;
        }
    }

}

enum KeyEventType {
    KEY_PRESS,
    KEY_DOWN,
    KEY_UP
}
