import { DownloadCloudIcon } from "lucide-react";
import { Button } from "../ui/button";
import JSZip from "jszip";

type Props = {
  files: File[];
};
export const ConvertedImagesDownloaderButton = ({ files }: Props) => {
  const download = async () => {
    const zip = new JSZip();

    files.forEach((file) => {
      zip.file(file.name, file);
    });

    const content = await zip.generateAsync({ type: "blob" });

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(content);
    downloadLink.download = "convert-result.zip";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <Button className="my-auto" onClick={download}>
      <DownloadCloudIcon />
    </Button>
  );
};
