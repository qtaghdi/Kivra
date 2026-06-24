import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { GithubLoginPanel } from "@/features/auth";

export function LoginRoute() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="mx-auto max-w-xl space-y-5 p-6"
    >
      <div>
        <h1 className="text-2xl font-semibold">{t("auth.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth.description")}</p>
      </div>
      <GithubLoginPanel />
    </motion.div>
  );
}
