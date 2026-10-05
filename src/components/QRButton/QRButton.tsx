import { forwardRef, useState, type MouseEvent, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "cn";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { AppStoreIcon, PlayMarketIcon } from "./StoreIcons";

const AppStoreUrl = "https://apps.apple.com/us/app/byteball/id1147137332#?platform=iphone";
const PlayMarketUrl = "https://play.google.com/store/apps/details?id=org.byteball.wallet";

export type QRButtonProps = {
  /** Obyte payment URI (`obyte:…` / `obyte-tn:…`). */
  href: string;
  children?: ReactNode;
  /** Called both when the QR dialog is opened and when the desktop button is clicked (as obyte-qr-button did). */
  onClick?: (ev: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  /** antd-era prop kept for call sites: "large" → shadcn size "lg". */
  size?: "small" | "middle" | "large";
  /** antd-era prop kept for call sites: "primary" → filled button, anything else → outline. */
  type?: "primary" | "default" | "link";
  className?: string;
};

const sizeMap: Record<NonNullable<QRButtonProps["size"]>, ButtonProps["size"]> = { small: "sm", middle: "default", large: "lg" };

/**
 * Replacement for the `obyte-qr-button` package (which was a precompiled bundle depending on antd 4).
 * Left button opens a dialog with a QR code for the mobile wallet, right button is a regular link that
 * opens the desktop wallet. The ref points at the desktop button so forms can trigger it with Enter.
 */
export const QRButton = forwardRef<HTMLAnchorElement, QRButtonProps>(function QRButton({ href, children, onClick, disabled = false, size = "middle", type = "default", className }, ref) {
  const [qrOpen, setQrOpen] = useState(false);
  const [downloadType, setDownloadType] = useState<false | "ios" | "android">(false);
  const { t } = useTranslation();

  const variant: ButtonProps["variant"] = type === "primary" ? "default" : type === "link" ? "link" : "outline";
  const btnSize = sizeMap[size];

  const openQr = (ev: MouseEvent<HTMLButtonElement>) => {
    setQrOpen(true);
    onClick?.(ev);
  };

  return (
    <>
      <div data-slot="button-group" className={cn("inline-flex items-stretch [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:last-child]:border-l-0", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant={variant} size={btnSize === "lg" ? "icon-lg" : btnSize === "sm" ? "icon-sm" : "icon"} disabled={disabled} onClick={openQr} aria-label={t("qr_button.tooltip_mob", "Send the transaction from your mobile phone")}>
              <QrCode />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("qr_button.tooltip_mob", "Send the transaction from your mobile phone")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            {disabled ? (
              <Button type="button" variant={variant} size={btnSize} disabled>
                {children}
              </Button>
            ) : (
              <Button variant={variant} size={btnSize} asChild>
                <a href={href} ref={ref} onClick={onClick}>
                  {children}
                </a>
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{t("qr_button.tooltip", "This will open your Obyte wallet installed on this computer and send the transaction")}</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="w-[340px] max-w-[calc(100%-2rem)] text-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center text-xl">
              <Trans i18nKey="qr_button.title">
                <span>
                  Scan this QR code <br /> with your mobile phone
                </span>
              </Trans>
            </DialogTitle>
            <DialogDescription className="sr-only">{href}</DialogDescription>
          </DialogHeader>
          <a href={href} className="mx-auto inline-block rounded-md bg-white p-3">
            <QRCodeSVG size={240} value={href} />
          </a>
          <div className="mt-2 text-xs text-muted-foreground">
            {/* The translations keep the obyte-qr-button placeholders "[ios]" / "[android]". */}
            {t("qr_button.install", "Install Obyte wallet for [ios] or [android] if you don't have one yet")
              .split(/(\[ios\]|\[android\])/)
              .map((part, index) =>
                part === "[ios]" || part === "[android]" ? (
                  <button key={index} type="button" className="cursor-pointer text-primary underline-offset-2 hover:underline" onClick={() => setDownloadType(part === "[ios]" ? "ios" : "android")}>
                    {part === "[ios]" ? "iOS" : "Android"}
                  </button>
                ) : (
                  <span key={index}>{part}</span>
                )
              )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!downloadType} onOpenChange={(open) => !open && setDownloadType(false)}>
        <DialogContent className="w-[340px] max-w-[calc(100%-2rem)] text-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center text-xl">{t("qr_button.download_title", "Download Obyte wallet")}</DialogTitle>
            <DialogDescription className="sr-only">{downloadType === "ios" ? AppStoreUrl : PlayMarketUrl}</DialogDescription>
          </DialogHeader>
          <div className="mx-auto inline-block rounded-md bg-white p-3">
            <QRCodeSVG size={240} value={downloadType === "ios" ? AppStoreUrl : PlayMarketUrl} />
          </div>
          <div className="mt-2 inline-flex items-center justify-center gap-1 text-sm">
            <span>{t("qr_button.obyte_in", "Obyte in")}</span>
            <a target="_blank" className="inline-flex items-center text-primary" rel="noopener" href={downloadType === "ios" ? AppStoreUrl : PlayMarketUrl}>
              {downloadType === "ios" ? (
                <>
                  <AppStoreIcon /> Apple App Store
                </>
              ) : (
                <>
                  <PlayMarketIcon /> Google Play
                </>
              )}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
