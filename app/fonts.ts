import localFont from "next/font/local";

export const iranPeyda = localFont({
  src: [
    {
      path: "../public/assets/fonts/Peyda/02-Farsi_Namerals/TTF/PeydaFaNum-Thin.ttf",
      weight: "100",
    },
    {
      path: "../public/assets/fonts/Peyda/02-Farsi_Namerals/TTF/PeydaFaNum-Regular.ttf",
      weight: "400",
    },
    {
      path: "../public/assets/fonts/Peyda/02-Farsi_Namerals/TTF/PeydaFaNum-Medium.ttf",
      weight: "500",
    },
    {
      path: "../public/assets/fonts/Peyda/02-Farsi_Namerals/TTF/PeydaFaNum-Bold.ttf",
      weight: "700",
    },
  ],
  variable: "--font-iran-peyda",
  display: "swap",
});
