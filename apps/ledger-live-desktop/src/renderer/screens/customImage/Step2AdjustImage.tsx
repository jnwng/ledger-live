import React, { useState } from "react";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { Step, StepProps } from "./types";
import ImageCropper, { CropParams } from "~/renderer/components/CustomImage/ImageCropper";
import { targetDisplayDimensions } from "~/renderer/components/CustomImage/shared";
import StepFooter from "./StepFooter";
import { useTranslation } from "react-i18next";
import StepContainer from "./StepContainer";
import { analyticsDrawerNames, analyticsFlowName } from "./shared";
import TrackPage from "~/renderer/analytics/TrackPage";

type Props = StepProps & {
  src?: ImageBase64Data;
  onResult: (res: ImageBase64Data) => void;
  initialCropParams?: CropParams;
  setCropParams: (_: CropParams) => void;
};

const previousButtonEventProperties = {
  button: "Back",
  drawer: analyticsDrawerNames.preview,
};

const nextButtonEventProperties = {
  button: "Confirm crop",
  drawer: analyticsDrawerNames.preview,
};

const StepAdjustImage: React.FC<Props> = props => {
  const [loading, setLoading] = useState(true);
  const { src, onResult, onError, initialCropParams, setCropParams, setStep } = props;
  const { t } = useTranslation();

  return (
    <StepContainer
      footer={
        <StepFooter
          previousStep={Step.chooseImage}
          previousLabel={t("common.previous")}
          nextStep={Step.chooseContrast}
          nextLabel={t("common.continue")}
          nextLoading={loading}
          nextDisabled={loading}
          previousTestId="custom-image-crop-previous-button"
          nextTestId="custom-image-crop-continue-button"
          setStep={setStep}
          previousEventProperties={previousButtonEventProperties}
          nextEventProperties={nextButtonEventProperties}
        />
      }
    >
      <TrackPage
        category={analyticsDrawerNames.preview}
        type="drawer"
        flow={analyticsFlowName}
        refreshSource={false}
      />
      {src ? (
        <ImageCropper
          {...src}
          initialCropParams={initialCropParams}
          setCropParams={setCropParams}
          targetDimensions={targetDisplayDimensions}
          onResult={onResult}
          onError={onError}
          setLoading={setLoading}
        />
      ) : null}
    </StepContainer>
  );
};

export default StepAdjustImage;
