import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";

export function InputPassword({
  className,
  type = "password",
  ...props
}: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput className={className} type={showPassword ? "text" : type} {...props} />
      <InputGroupAddon
        align="inline-end"
        onClick={() => {
          setShowPassword(!showPassword);
        }}
        className="cursor-pointer"
      >
        {showPassword ? (
          <EyeOffIcon className="size-4 text-muted-foreground" />
        ) : (
          <EyeIcon className="size-4 text-muted-foreground" />
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
