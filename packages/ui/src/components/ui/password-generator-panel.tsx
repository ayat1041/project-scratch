"use client";

import { useEffect, useState } from "react";
import { Wand2, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "./button";
import { Label } from "./label";
import { Slider } from "./slider";

interface PasswordGeneratorPanelProps {
  /** Called when a password is generated */
  onPasswordGenerated: (password: string) => void;
  /** The current password value from the input field (used for copy functionality) */
  inputPassword?: string;
  /** Minimum password length (default: 12) */
  minLength?: number;
  /** Maximum password length (default: 64) */
  maxLength?: number;
  /** Color scheme for the panel styling (default: 'primary') */
  colorScheme?: "primary" | "secondary";
  /** Whether to prevent blur on interactive elements (default: false) */
  preventBlur?: boolean;
  /** Whether to show data-testid attributes for testing (default: false) */
  showTestIds?: boolean;
  /** Called when the generator panel is expanded (user clicks "Generate Password") */
  onPanelOpen?: () => void;
  /** Called when the generator panel is collapsed (user clicks "Hide Generator") */
  onPanelClose?: () => void;
}

export default function PasswordGeneratorPanel({
  onPasswordGenerated,
  inputPassword,
  minLength = 12,
  maxLength = 64,
  colorScheme = "primary",
  preventBlur = false,
  showTestIds = false,
  onPanelOpen,
  onPanelClose,
}: PasswordGeneratorPanelProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatorLength, setGeneratorLength] = useState(16);

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const len = Math.max(
      minLength,
      Math.min(maxLength, Math.floor(generatorLength)),
    );

    const charset = uppercase + lowercase + numbers + symbols;
    const requiredSets = [uppercase, lowercase, numbers, symbols];
    const passwordChars: string[] = [];

    // Ensure at least one character from each required set
    requiredSets.forEach((set) => {
      const ch = set.charAt(Math.floor(Math.random() * set.length));
      passwordChars.push(ch);
    });

    for (let i = passwordChars.length; i < len; i++) {
      passwordChars.push(
        charset.charAt(Math.floor(Math.random() * charset.length)),
      );
    }

    // Fisher-Yates shuffle
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = passwordChars[i]!;
      passwordChars[i] = passwordChars[j]!;
      passwordChars[j] = tmp;
    }

    const newPassword = passwordChars.join("");
    setPassword(newPassword);
    setCopied(false);
    onPasswordGenerated(newPassword);
  };

  const copyToClipboard = async () => {
    const textToCopy = inputPassword || password;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (generatorLength < minLength) setGeneratorLength(minLength);
    if (generatorLength > maxLength) setGeneratorLength(maxLength);
  }, [generatorLength, minLength, maxLength]);

  const handleMouseDown = preventBlur
    ? (e: React.MouseEvent) => e.preventDefault()
    : undefined;

  // Color-scheme-dependent classes
  const isPrimary = colorScheme === "primary";
  const panelBg = isPrimary ? "bg-primary/5" : "bg-secondary/5";
  const panelBorder = isPrimary ? "border-primary/20" : "border-secondary/20";
  const iconColor = isPrimary ? "text-primary" : "text-secondary";
  const hideHoverColor = isPrimary
    ? "hover:text-primary"
    : "hover:text-secondary";
  const generateBtnClass = isPrimary ? "" : "bg-secondary";

  const testId = (id: string) => (showTestIds ? { "data-testid": id } : {});

  return (
    <div onMouseDown={handleMouseDown}>
      {/* Generate Password Button & Copy */}
      <div
        className="mt-2 flex gap-2"
        {...testId("password-generator-actions")}
      >
        {!showGenerator && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowGenerator(true);
              onPanelOpen?.();
            }}
            className="flex items-center gap-2 mb-2"
            {...testId("show-generator-btn")}
          >
            <Wand2 className="h-4 w-4" />
            Generate Password
          </Button>
        )}
        {(inputPassword || password) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="mb-1 flex items-center gap-2"
            {...testId("copy-password-btn")}
          >
            {copied ? (
              <Check className="text-success h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        )}
      </div>

      {/* Password Generator Panel */}
      {showGenerator && (
        <>
          <div
            className={`${panelBg} ${panelBorder} space-y-4 rounded-lg border p-4 mb-2 mt-2`}
            {...testId("password-generator-panel")}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-foreground flex items-center gap-2 text-sm font-semibold"
                {...testId("generator-title")}
              >
                <Wand2 className={`h-4 w-4 ${iconColor}`} />
                Password Generator
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={generatePassword}
                className={`flex items-center gap-2 ${generateBtnClass}`}
                {...testId("generate-password-btn")}
              >
                <RefreshCw className="h-4 w-4" />
                Generate
              </Button>
            </div>

            {/* Length Slider */}
            <div className="space-y-2" {...testId("length-slider-section")}>
              <div className="flex items-center justify-between">
                <Label
                  className="text-muted-foreground text-sm"
                  {...testId("length-label")}
                >
                  Length
                </Label>
                <span
                  className="rounded bg-muted px-2 py-0.5 font-mono text-sm"
                  {...testId("length-value")}
                >
                  {generatorLength}
                </span>
              </div>
              <Slider
                value={[generatorLength]}
                onValueChange={(value: number[]) =>
                  setGeneratorLength(value[0] ?? minLength)
                }
                min={minLength}
                max={maxLength}
                step={1}
                className="w-full"
                {...testId("length-slider")}
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span {...testId("min-length")}>{minLength}</span>
                <span {...testId("max-length")}>{maxLength}</span>
              </div>
            </div>
          </div>
          {/* Hide Generator Button */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => {
                setShowGenerator(false);
                onPanelClose?.();
              }}
              className={`text-muted-foreground ${hideHoverColor} text-sm transition-colors`}
              {...testId("hide-generator-btn")}
            >
              Hide Generator
            </button>
          </div>
        </>
      )}
    </div>
  );
}
