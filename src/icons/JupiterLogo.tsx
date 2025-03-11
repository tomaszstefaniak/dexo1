import React from 'react';
import Web3LogoMiniWhite from '../img/web3_logo_mini_white.png';

const JupiterLogo: React.FC<{ width?: number; height?: number }> = ({ width = 24, height = 24 }) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={Web3LogoMiniWhite.src} width={width} height={height} alt="Web3 Logo Mini White" />;
};

export default JupiterLogo;
