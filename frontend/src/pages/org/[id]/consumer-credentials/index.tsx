import { useTranslation } from "react-i18next";
import Head from "next/head";

import { ConsumerCredentialsPage } from "@app/views/Org/ConsumerCredentialsPage";

const ConsumerCredentials = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full bg-bunker-800">
      <Head>
        <title>{t("common.head-title", { title: "Consumer Credentials" })}</title>
        <link rel="icon" href="/infisical.ico" />
        <meta property="og:image" content="/images/message.png" />
      </Head>
      <ConsumerCredentialsPage />
    </div>
  );
};

export default ConsumerCredentials;

ConsumerCredentials.requireAuth = true;
