import { OrgPermissionActions, OrgPermissionSubjects } from "@app/context";
import { withPermission } from "@app/hoc";

import { ConsumerCredentialsTable } from "./components/ConsumerCredentialsTable";

export const ConsumerCredentialsPage = withPermission(
  () => {
    return (
      <div className="container mx-auto flex flex-col justify-between bg-bunker-800 text-white">
        <div className="mx-auto mb-6 w-full max-w-7xl py-6 px-6">
          <p className="mr-4 text-3xl font-semibold text-white">
            Consumer credentials management system
          </p>
          <p className="text-md mb-4 text-bunker-300">Manage a variety of user credentials.</p>
          <ConsumerCredentialsTable />
        </div>
      </div>
    );
  },
  { action: OrgPermissionActions.Read, subject: OrgPermissionSubjects.ConsumerCredentials }
);
