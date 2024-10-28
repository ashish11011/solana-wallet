"use client";

import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { hash } from "crypto";
import { derivePath } from "ed25519-hd-key";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import bs58 from "bs58";
import nacl from "tweetnacl";

const WallerRequest = () => {
  const [walletAction, setWalletAction] = useState<String>("");
  const [walletMnemonic, setWalletMnemonic] = useState<String>("");
  const [walletMnemonicArray, setWalletMnemonicArray] = useState<any>([]);
  const router = useRouter();
  function createNewWallet() {
    setWalletAction("create");
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    const path = "m/44'/60'/0'/0'/0'";

    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);

    // Encode the public key in Base58
    const publicKey = bs58.encode(Buffer.from(keyPair.publicKey));

    // Encode the complete secretKey (both private and public key) in Base58
    const privateKey = bs58.encode(Buffer.from(keyPair.secretKey));

    localStorage.setItem(
      "accounts",
      JSON.stringify([
        {
          index: 0,
          publicKey: publicKey,
          privateKey: privateKey,
        },
      ])
    );

    localStorage.setItem("mnemonic", mnemonic);
    setWalletMnemonic(mnemonic);
    const mnemonicArray = mnemonic.split(" ");
    setWalletMnemonicArray(mnemonicArray);
  }
  return (
    <div>
      <div className="p-4 bg-neutral-800 w-full mt-[24vh] mx-auto max-w-xl flex flex-col gap-6  rounded-lg">
        <div className=" text-4xl text-center">
          Get Started with Your <span className=" text-purple-300">Flux</span>{" "}
          Wallet
        </div>
        {walletAction === "" && (
          <div
            onClick={() => createNewWallet()}
            className=" border border-purple-300 cursor-pointer rounded-md md:mt-8  text-center px-3 py-2 "
          >
            Create new wallet
          </div>
        )}
        {walletAction === "" && (
          <div
            onClick={() => setWalletAction("import")}
            className=" border border-purple-300 cursor-pointer rounded-md  text-center px-3 py-2"
          >
            Add existing wallet
          </div>
        )}
        {walletAction === "create" && (
          <CreateNewWallet
            walletMnemonic={walletMnemonic}
            walletMnemonicArray={walletMnemonicArray}
          />
        )}
        {walletAction === "import" && <AddExistingWallet />}
      </div>
    </div>
  );
};
function CreateNewWallet({ walletMnemonic, walletMnemonicArray }: any) {
  const router = useRouter();
  const [copyStatus, setCopyStatus] = useState<string>("Click here");

  const handleCopy = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.blur();
    navigator.clipboard.writeText(walletMnemonic);
    setCopyStatus("Copied!");

    setTimeout(() => setCopyStatus("Click here"), 3000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="">
        Copy this mnemonic{" "}
        <span onClick={handleCopy} className="text-purple-300 cursor-pointer">
          {copyStatus}
        </span>
      </div>

      <div className="grid gap-3 grid-cols-3 md:grid-cols-4">
        {walletMnemonicArray.map((item: string, index: number) => (
          <div key={index} className="bg-neutral-700 p-2 rounded text-center">
            {item}
          </div>
        ))}
      </div>
      <Link
        className="text-purple-300 cursor-pointer mt-3 underline"
        href={"/"}
      >
        Continue to wallet
      </Link>
    </div>
  );
}

function AddExistingWallet() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [mnemonicArray, setMnemonicArray] = useState<string[]>([]);

  function handleMnemonic(mnemonic: string) {
    try {
      const seed = mnemonicToSeedSync(mnemonic);
      const path = "m/44'/60'/0'/0'/0'";

      const derivedSeed = derivePath(path, seed.toString("hex")).key;
      const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);

      // Encode the public key in Base58
      const publicKey = bs58.encode(Buffer.from(keyPair.publicKey));

      // Encode the complete secretKey (both private and public key) in Base58
      const privateKey = bs58.encode(Buffer.from(keyPair.secretKey));

      localStorage.setItem(
        "accounts",
        JSON.stringify([
          {
            index: 0,
            publicKey: publicKey,
            privateKey: privateKey,
          },
        ])
      );
    } catch (error) {
      setErrorMessage("The mnemonic is invalid. Please try again.");
    }
    const mnemonicArrayLocal = mnemonic.trim().split(" ");

    if (mnemonicArrayLocal.length === 12) {
      setMnemonicArray(mnemonicArrayLocal);
      setErrorMessage("");
      router.push("/");
    } else {
      setErrorMessage("The mnemonic is invalid. Please try again.");
    }
  }
  return (
    <div className=" flex flex-col md:mt-8 gap-6">
      <input
        className=" border bg-neutral-700 border-purple-300 px-3 py-2 rounded"
        placeholder="Enter your mnemonic"
        type="text"
        value={mnemonic}
        onChange={(e) => setMnemonic(e.target.value)}
      />
      <div
        onClick={() => handleMnemonic(mnemonic)}
        className="bg-purple-300 rounded py-2 px-3 font-semibold text-center text-purple-800 cursor-pointer"
      >
        Continue
      </div>
      {errorMessage && <div className=" text-red-500">{errorMessage}</div>}
    </div>
  );
}

export default WallerRequest;
