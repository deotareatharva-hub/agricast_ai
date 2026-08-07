import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import Button from "./Button";

export default function Dialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isConfirming,
  onConfirm,
  danger = true,
}) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-neutral-500">{message}</p>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isConfirming}>
          {cancelLabel || t("common.cancel")}
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          isLoading={isConfirming}
        >
          {confirmLabel || t("common.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
