import { useTranslation } from "react-i18next";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isConfirming,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-neutral-500">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
          {cancelLabel || t("common.cancel")}
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isConfirming}>
          {isConfirming ? t("common.deleting") : confirmLabel || t("common.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
