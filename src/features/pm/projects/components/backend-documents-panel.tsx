"use client";

import {
  type BackendDocumentsPanelInput,
  useBackendDocumentsPanelViewModel,
} from "../view-model/use-documents-panel-view-model";
import { BackendDocumentsPanelView } from "../view/backend-documents-panel-view";

export function BackendDocumentsPanel(props: BackendDocumentsPanelInput) {
  const vm = useBackendDocumentsPanelViewModel(props);
  return <BackendDocumentsPanelView vm={vm} />;
}
