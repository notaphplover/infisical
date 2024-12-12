import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createNotification } from "@app/components/notifications";
import {
  Button,
  DatePicker,
  FormControl,
  Input,
  Modal,
  ModalClose,
  ModalContent
} from "@app/components/v2";
import {
  useCreateConsumerCredentials,
  useUpdateConsumerCredentials
} from "@app/hooks/api/consumerCredentials/mutations";
import { TConsumerCredentials } from "@app/hooks/api/consumerCredentials/types";

const creditCardFormSchema = z.object({
  cardNumber: z.string().max(20).trim(),
  cvv: z.string().max(4),
  expiryDate: z.date()
});

export type CreditCardFormData = z.infer<typeof creditCardFormSchema>;

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  consumerCredentials?: TConsumerCredentials | null;
};

type CreditCardFormProps = Pick<Props, "consumerCredentials"> & {
  onComplete: () => void;
};

const CreditCardConsumerCredentialsForm = ({
  onComplete,
  consumerCredentials
}: CreditCardFormProps) => {
  const [isExpiryDatePickerOpen, setIsExpiryDatePickerOpen] = useState(false);

  const createConsumerCredentials = useCreateConsumerCredentials();
  const updateConsumerCredentials = useUpdateConsumerCredentials();
  const isUpdate = !!consumerCredentials;

  const {
    control,
    handleSubmit,
    register,
    formState: { isSubmitting, errors }
  } = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardFormSchema),
    defaultValues: {
      cardNumber: "",
      cvv: ""
    }
  });

  const handleCreateCreditCardConsumerCredentials = async ({
    cardNumber,
    cvv,
    expiryDate
  }: CreditCardFormData) => {
    const mutation = isUpdate
      ? updateConsumerCredentials.mutateAsync({
          cardNumber,
          cvv,
          expiryDate,
          id: consumerCredentials.id,
          type: "creditCard"
        })
      : createConsumerCredentials.mutateAsync({
          cardNumber,
          cvv,
          expiryDate,
          type: "creditCard"
        });

    try {
      await mutation;
      createNotification({
        text: `Successfully ${isUpdate ? "updated" : "added"} key`,
        type: "success"
      });
      onComplete();
    } catch (err) {
      console.error(err);
      createNotification({
        text: `Failed to ${isUpdate ? "update" : "add"} key`,
        type: "error"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleCreateCreditCardConsumerCredentials)}>
      <FormControl
        helperText="Card number must be composed by digits only"
        errorText={errors.cardNumber?.message}
        isError={Boolean(errors.cardNumber?.message)}
        label="Name"
      >
        <Input autoFocus placeholder="my-card-number" {...register("cardNumber")} />
      </FormControl>
      <FormControl
        label="CVV"
        errorText={errors.cvv?.message}
        isError={Boolean(errors.cvv?.message)}
      >
        <Input autoFocus placeholder="my-card-cvv" {...register("cvv")} />
      </FormControl>
      <Controller
        name="expiryDate"
        control={control}
        render={({ field: { onChange, ...field }, fieldState: { error } }) => {
          return (
            <FormControl label="Expiry date" errorText={error?.message} isError={Boolean(error)}>
              <DatePicker
                value={field.value || undefined}
                onChange={onChange}
                dateFormat="P"
                popUpProps={{
                  open: isExpiryDatePickerOpen,
                  onOpenChange: setIsExpiryDatePickerOpen
                }}
                popUpContentProps={{}}
              />
            </FormControl>
          );
        }}
      />
      <div className="flex items-center">
        <Button
          className="mr-4"
          size="sm"
          type="submit"
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          {isUpdate ? "Update" : "Add"} Key
        </Button>
        <ModalClose asChild>
          <Button colorSchema="secondary" variant="plain">
            Cancel
          </Button>
        </ModalClose>
      </div>
    </form>
  );
};

export const ConsumerCredentialsModal = ({ isOpen, onOpenChange, consumerCredentials }: Props) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent title={`${consumerCredentials ? "Update" : "Add"} Key`}>
        <CreditCardConsumerCredentialsForm
          onComplete={() => onOpenChange(false)}
          consumerCredentials={consumerCredentials}
        />
      </ModalContent>
    </Modal>
  );
};
