"use client";

import { ClientProductContentView } from "../view/client-product-view";
import { useClientProductViewModel } from "../view-model/use-client-product-view-model";

export function ClientProductView() {
  const vm = useClientProductViewModel();
  return <ClientProductContentView vm={vm} />;
}
