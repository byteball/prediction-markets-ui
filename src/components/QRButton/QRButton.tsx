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
  href: string;
  children?: ReactNode;
  onClick?: (ev: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  type?: "primary" | "default" | "link";
  className?: string;
};

const sizeMap: Record<NonNullable<QRButtonProps["size"]>, ButtonProps["size"]> = { small: "sm", middle: "default", large: "lg" };

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
              <span tabIndex={0} className="inline-flex">
                <Button type="button" variant={variant} size={btnSize} className="rounded-l-none border-l-0" disabled>
                  {children}
                </Button>
              </span>
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
