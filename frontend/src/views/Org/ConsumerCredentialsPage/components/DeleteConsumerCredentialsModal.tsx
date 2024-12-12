import { createNotification } from "@app/components/notifications";
import { DeleteActionModal } from "@app/components/v2";
import { useDeleteConsumerCredentials } from "@app/hooks/api/consumerCredentials/mutations";
import { TConsumerCredentials } from "@app/hooks/api/consumerCredentials/types";

type Props = {
  consumerCredentials: TConsumerCredentials;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export const DeleteConsumerCredentialsModal = ({
  isOpen,
  onOpenChange,
  consumerCredentials
}: Props) => {
  const deleteConsumerCredentials = useDeleteConsumerCredentials();

  if (!consumerCredentials) return null;

  const { id } = consumerCredentials;

  const handleDeleteConsumerCredentials = async () => {
    try {
      await deleteConsumerCredentials.mutateAsync({
        id
      });

      createNotification({
        text: "Consumer credentials successfully deleted",
        type: "success"
      });

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      const error = err as any;
      const text = error?.response?.data?.message ?? "Failed to delete key";

      createNotification({
        text,
        type: "error"
      });
    }
  };

  return (
    <DeleteActionModal
      isOpen={isOpen}
      title="Are you sure want to delete consumer credential?"
      onChange={onOpenChange}
      deleteKey="confirm"
      onDeleteApproved={handleDeleteConsumerCredentials}
    />
  );
};
