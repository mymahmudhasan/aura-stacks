import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          type={show ? "text" : "password"}
          className={cn(
            "w-full px-4 py-3 pr-11 rounded-xl bg-input/50 border border-border focus:border-primary outline-none",
            className,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";
