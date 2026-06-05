import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

export const shareReportCard = async (cardRef, rawImageUri) => {
  if (Platform.OS === 'web') {
    try {
      // Dynamic import html2canvas to prevent problems on platforms where it's not supported
      const html2canvas = (await import('html2canvas')).default;
      
      const cardElement = cardRef.current;
      if (!cardElement) {
        console.error("Card ref is empty");
        alert("Unable to find report card layout.");
        return;
      }

      // We need to capture the DOM element. In React Native Web, cardRef.current refers to the DOM node.
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#1e293b',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to generate image.");
          return;
        }

        const file = new File([blob], 'infrawatch-report.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'InfraWatch Infrastructure Report',
              text: 'Here is an AI-analyzed infrastructure safety report from InfraWatch.',
            });
          } catch (shareError) {
            // User cancelled share or other error, fallback to download
            console.log("Web share failed, falling back to download:", shareError);
            downloadBlob(blob);
          }
        } else {
          // Download directly
          downloadBlob(blob);
        }
      }, 'image/png');

    } catch (err) {
      console.error("html2canvas generation failed: ", err);
      alert("Error sharing report card image. Falling back to direct download.");
    }
  } else {
    // Native sharing
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        // Native platforms share the image file
        await Sharing.shareAsync(rawImageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share InfraWatch Report Image',
        });
      } else {
        alert("Sharing is not available on this device.");
      }
    } catch (nativeError) {
      console.error("Native sharing error: ", nativeError);
      alert("Unable to share image: " + nativeError.message);
    }
  }
};

const downloadBlob = (blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `infrawatch-report-${Date.now()}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
