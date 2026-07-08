"use client";

import {
  type BackendDeliveryReviewPanelInput,
  useDeliveryReviewPanelViewModel,
} from "../view-model/use-delivery-review-panel-view-model";
import { BackendDeliveryReviewPanelView } from "../view/backend-delivery-review-panel-view";

export function BackendDeliveryReviewPanel(props: BackendDeliveryReviewPanelInput) {
  const vm = useDeliveryReviewPanelViewModel(props);
  return <BackendDeliveryReviewPanelView vm={vm} />;
}
