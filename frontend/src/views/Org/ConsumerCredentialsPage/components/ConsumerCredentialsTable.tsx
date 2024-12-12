import Link from "next/link";
import {
  faArrowUpRightFromSquare,
  faEdit,
  faEllipsis,
  faKey,
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

import { OrgPermissionCan } from "@app/components/permissions";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  Pagination,
  Spinner,
  Table,
  TableContainer,
  TableSkeleton,
  TBody,
  Td,
  Th,
  THead,
  Tooltip,
  Tr
} from "@app/components/v2";
import { OrgPermissionActions, OrgPermissionSubjects, useOrgPermission } from "@app/context";
import { usePagination, usePopUp } from "@app/hooks";
import { useGetConsumerCredentials } from "@app/hooks/api/consumerCredentials/queries";
import {
  TConsumerCredentials,
  TCreditCardConsumerCredentials
} from "@app/hooks/api/consumerCredentials/types";

import { ConsumerCredentialsModal } from "./ConsumerCredentialsModal";
import { DeleteConsumerCredentialsModal } from "./DeleteConsumerCredentialsModal";

export interface ConsumerCredentialsTableParams {
  type: "creditCard" | "webLogin";
}

export const ConsumerCredentialsTable = () => {
  const { permission } = useOrgPermission();

  const { offset, limit, setPage, perPage, page, setPerPage } = usePagination("");

  const { data, isLoading, isFetching } = useGetConsumerCredentials({
    offset,
    limit,
    type: "creditCard"
  });

  const { keys = [] } = data ?? {};

  const { popUp, handlePopUpOpen, handlePopUpToggle } = usePopUp([
    "upsertConsumerCredentials",
    "deleteConsumerCredentials"
  ] as const);

  const cannotEditConsumerCredentials = permission.cannot(
    OrgPermissionActions.Edit,
    OrgPermissionSubjects.ConsumerCredentials
  );

  const cannotDeleteConsumerCredentials = permission.cannot(
    OrgPermissionActions.Delete,
    OrgPermissionSubjects.ConsumerCredentials
  );

  return (
    <motion.div
      key="kms-keys-tab"
      transition={{ duration: 0.15 }}
      initial={{ opacity: 0, translateX: 30 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: 30 }}
    >
      <div className="mb-6 rounded-lg border border-mineshaft-600 bg-mineshaft-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="whitespace-nowrap text-xl font-semibold text-mineshaft-100">Keys</p>
          <div className="flex w-full justify-end pr-4">
            <Link href="https://infisical.com/docs/documentation/platform/consumer-credentials">
              <span className="w-max cursor-pointer rounded-md border border-mineshaft-500 bg-mineshaft-600 px-4 py-2 text-mineshaft-200 duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-white">
                Documentation{" "}
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="mb-[0.06rem] ml-1 text-xs"
                />
              </span>
            </Link>
          </div>
          <OrgPermissionCan
            I={OrgPermissionActions.Create}
            a={OrgPermissionSubjects.ConsumerCredentials}
          >
            {(isAllowed) => (
              <Button
                colorSchema="primary"
                type="submit"
                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                onClick={() => handlePopUpOpen("upsertConsumerCredentials", null)}
                isDisabled={!isAllowed}
              >
                Add
              </Button>
            )}
          </OrgPermissionCan>
        </div>
        <TableContainer>
          <Table>
            <THead>
              <Tr className="h-14">
                <Th>Card number</Th>
                <Th>Cvv</Th>
                <Th>Expiry date</Th>
                <Th className="w-16">{isFetching ? <Spinner size="xs" /> : null}</Th>
              </Tr>
            </THead>
            <TBody>
              {isLoading && <TableSkeleton columns={3} innerKey="card-credentials" />}
              {!isLoading &&
                keys.length > 0 &&
                keys.map((consumerCredentials) => {
                  const { id, cardNumber, cvv, expiryDate } =
                    consumerCredentials as TCreditCardConsumerCredentials;

                  return (
                    <Tr className="group h-10 hover:bg-mineshaft-700" key={`st-v3-${id}`}>
                      <Td>
                        <div className="flex items-center gap-2 ">{cardNumber}</div>
                      </Td>
                      <Td>
                        <div className="flex items-center">{cvv}</div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2 ">{expiryDate.toISOString()}</div>
                      </Td>
                      <Td className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton
                              variant="plain"
                              colorSchema="primary"
                              className="ml-4 p-0 data-[state=open]:text-primary-400"
                              ariaLabel="More options"
                            >
                              <FontAwesomeIcon size="lg" icon={faEllipsis} />
                            </IconButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="min-w-[160px]">
                            <Tooltip
                              content={cannotEditConsumerCredentials ? "Access Restricted" : ""}
                              position="left"
                            >
                              <div>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handlePopUpOpen(
                                      "upsertConsumerCredentials",
                                      consumerCredentials
                                    )
                                  }
                                  icon={<FontAwesomeIcon icon={faEdit} />}
                                  iconPos="left"
                                  isDisabled={cannotEditConsumerCredentials}
                                >
                                  Edit Credentials
                                </DropdownMenuItem>
                              </div>
                            </Tooltip>
                            <Tooltip
                              content={cannotDeleteConsumerCredentials ? "Access Restricted" : ""}
                              position="left"
                            >
                              <div>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handlePopUpOpen(
                                      "deleteConsumerCredentials",
                                      consumerCredentials
                                    )
                                  }
                                  icon={<FontAwesomeIcon icon={faTrash} />}
                                  iconPos="left"
                                  isDisabled={cannotDeleteConsumerCredentials}
                                >
                                  Delete Key
                                </DropdownMenuItem>
                              </div>
                            </Tooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Td>
                    </Tr>
                  );
                })}
            </TBody>
          </Table>
          {!isLoading && (
            <Pagination
              count={0}
              page={page}
              perPage={perPage}
              onChangePage={(newPage) => setPage(newPage)}
              onChangePerPage={(newPerPage) => setPerPage(newPerPage)}
            />
          )}
          {!isLoading && keys.length === 0 && (
            <EmptyState
              title="No consumer credentials have been added to this project"
              icon={faKey}
            />
          )}
        </TableContainer>
        <DeleteConsumerCredentialsModal
          isOpen={popUp.deleteConsumerCredentials.isOpen}
          onOpenChange={(isOpen) => handlePopUpToggle("deleteConsumerCredentials", isOpen)}
          consumerCredentials={popUp.deleteConsumerCredentials.data as TConsumerCredentials}
        />
        <ConsumerCredentialsModal
          isOpen={popUp.upsertConsumerCredentials.isOpen}
          onOpenChange={(isOpen) => handlePopUpToggle("upsertConsumerCredentials", isOpen)}
          consumerCredentials={popUp.upsertConsumerCredentials.data as TConsumerCredentials | null}
        />
      </div>
    </motion.div>
  );
};
