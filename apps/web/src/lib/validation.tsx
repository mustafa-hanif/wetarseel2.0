import { createStore } from "solid-js/store";

// Type definitions
type ValidatorFunction = (
  element: HTMLInputElement
) => Promise<string | null> | string | null;

interface FieldConfig {
  element: HTMLInputElement;
  validators: ValidatorFunction[];
}

type ErrorsStore = Record<string, string | undefined>;

type SetErrorsFunction = (errors: Partial<ErrorsStore>) => void;

function checkValid(
  { element, validators = [] }: FieldConfig,
  setErrors: SetErrorsFunction,
  errorClass?: string
) {
  return async () => {
    element.setCustomValidity("");
    element.checkValidity();
    let message = element.validationMessage;
    if (!message) {
      for (const validator of validators) {
        const text = await validator(element);
        if (text) {
          element.setCustomValidity(text);
          break;
        }
      }
      message = element.validationMessage;
    }
    if (message) {
      errorClass && element.classList.toggle(errorClass, true);
      setErrors({ [element.name]: message });
    }
  };
}

// Interface for the return value of useForm
interface UseFormReturn {
  validate: (
    ref: HTMLInputElement,
    accessor: () => ValidatorFunction | ValidatorFunction[]
  ) => void;
  formSubmit: (
    ref: HTMLFormElement,
    accessor: () => ((form: HTMLFormElement) => void) | undefined
  ) => void;
  errors: ErrorsStore;
}

export function useForm({
  errorClass,
}: {
  errorClass?: string;
}): UseFormReturn {
  const [errors, setErrors] = createStore<ErrorsStore>({}),
    fields: Record<string, FieldConfig> = {};

  const validate = (
    ref: HTMLInputElement,
    accessor: () => ValidatorFunction | ValidatorFunction[]
  ) => {
    const accessorValue = accessor();
    const validators = Array.isArray(accessorValue) ? accessorValue : [];
    let config: FieldConfig;
    fields[ref.name] = config = { element: ref, validators };
    ref.onblur = checkValid(config, setErrors, errorClass);
    ref.oninput = () => {
      if (!errors[ref.name]) return;
      setErrors({ [ref.name]: undefined });
      errorClass && ref.classList.toggle(errorClass, false);
    };
  };

  const formSubmit = (
    ref: HTMLFormElement,
    accessor: () => ((form: HTMLFormElement) => void) | undefined
  ) => {
    const callback = accessor() || (() => {});
    ref.setAttribute("novalidate", "");
    ref.onsubmit = async (e: SubmitEvent) => {
      e.preventDefault();
      let errored = false;

      for (const k in fields) {
        const field = fields[k];
        await checkValid(field, setErrors, errorClass)();
        if (!errored && field.element.validationMessage) {
          field.element.focus();
          errored = true;
        }
      }
      !errored && callback(ref);
    };
  };

  return { validate, formSubmit, errors };
}
