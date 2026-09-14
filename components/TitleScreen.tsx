import Image from "next/image";

// 256x224 is the SNES native resolution; 1.5x keeps it an exact
// integer multiple so the pixels stay square.
const TitleScreen = () => {
  return(
    <Image
        className="title-screen"
        src="/img/Title.png"
        alt="FF6 BNW logo"
        width={384}
        height={336}
        quality={100}
        priority
    />
  );
};
export default TitleScreen;
