import { _DEV } from "../../constants";

export const echo = (function () {
  type QueueItem = {
    value: string;
    css: string;
  };

  let queue: QueueItem[] = [];
  const ECHO_TOKEN = {};
  const RESET_INPUT = "%c ";
  const RESET_CSS = "";

  function alertFormatting(value: string): typeof ECHO_TOKEN {
    queue.push({
      value: value,
      css: "display: inline-block ; background-color: #e0005a ; color: #ffffff ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;",
    });
    return ECHO_TOKEN;
  }

  function infoFormatting(value: string): typeof ECHO_TOKEN {
    queue.push({
      value: value,
      css: "display: inline-block ; background-color: #5999FF ; color: #ffffff ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;",
    });
    return ECHO_TOKEN;
  }

  function warningFormatting(value: string): typeof ECHO_TOKEN {
    queue.push({
      value: value,
      css: "display: inline-block ; background-color: black ; color: white ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;",
    });
    return ECHO_TOKEN;
  }

  function yellowFormatting(value: string): typeof ECHO_TOKEN {
    queue.push({
      value: value,
      css: "display: inline-block ; background-color: gold ; color: black ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;",
    });
    return ECHO_TOKEN;
  }

  function greenFormatting(value: string): typeof ECHO_TOKEN {
    queue.push({
      value: value,
      css: "display: inline-block ; background-color: #9A27D5 ; color: white ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;",
    });
    return ECHO_TOKEN;
  }

  function using(consoleFunction: (...data: any[]) => void) {
    return function consoleFunctionProxy(...args: any[]) {
      if (!_DEV) return;

      let inputs: string[] = [];
      let modifiers: any[] = [];

      for (const element of args) {
        if (element === ECHO_TOKEN) {
          const item = queue.shift();
          if (item) {
            inputs.push(`%c${item.value}`, RESET_INPUT);
            modifiers.push(item.css, RESET_CSS);
          }
        } else {
          const arg = element;
          if (typeof arg === "object" || typeof arg === "function") {
            inputs.push("%o", RESET_INPUT);
            modifiers.push(arg, RESET_CSS);
          } else {
            inputs.push(`%c${arg}`, RESET_INPUT);
            modifiers.push(RESET_CSS, RESET_CSS);
          }
        }
      }

      consoleFunction(inputs.join(""), ...modifiers);
      queue = [];
    };
  }

  return {
    log: using(console.log),
    warn: using(console.warn),
    error: using(console.error),
    trace: using(console.trace),
    group: using(console.group),
    groupEnd: using(console.groupEnd),

    asAlert: alertFormatting,
    asInfo: infoFormatting,
    asWarning: warningFormatting,
    asYellow: yellowFormatting,
    asGreen: greenFormatting,
  };
})();
