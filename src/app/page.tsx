"use client";
import { Keypair } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import {
  CircleX,
  Clipboard,
  ClipboardPlus,
  Eye,
  EyeClosed,
  LoaderCircle,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import bs58 from "bs58";
import nacl from "tweetnacl";

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedMnemonic = window.localStorage.getItem("mnemonic");
    if (storedMnemonic) {
      setMnemonic(storedMnemonic);
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="w-full min-h-screen text-gray-100 bg-neutral-900">
      <div className="flex flex-col gap-12 max-w-4xl px-4 mx-auto">
        <div className="w-full text-5xl text-purple-300 font-medium mt-[20vh]">
          Flux <span className="text-white">Wallet</span>
        </div>
        <ShowWalletDetails mnemonic={mnemonic} />
        <div
          onClick={() => {
            localStorage.removeItem("accounts");
            localStorage.removeItem("mnemonic");
            router.push("/login");
          }}
          className=" py-1.5 flex gap-2 items-center px-2 bg-red-500 cursor-pointer select-none -mt-4 hover:scale-105 duration-200 rounded w-fit text-white"
        >
          <LogOut size={20} /> Remove Account
        </div>
      </div>
    </div>
  );
}

interface currentAccountDetails {
  index: number;
  publicKey: string;
  privateKey: string;
}

function ShowWalletDetails({ mnemonic }: { mnemonic: string }) {
  const [accountsArray, setAccountsArray] = useState<any[]>([
    {
      index: 0,
      publicKey: "",
      privateKey: "",
    },
  ]);
  const [currentAccountDetails, setCurrentAccountDetails] =
    useState<currentAccountDetails | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedAccounts = localStorage.getItem("accounts");
    if (storedAccounts) {
      try {
        const parsedAccounts = JSON.parse(storedAccounts);
        setAccountsArray(parsedAccounts);
        setCurrentAccountDetails(parsedAccounts[0]);
      } catch (error) {
        console.error("Failed to parse accounts from localStorage:", error);
      }
    } else {
      router.push("/login");
    }
  }, []);

  function handleCurrentAccount(item: any) {
    const currentAccountData = accountsArray.find(
      (account: any) => account.index === item
    );

    console.log("currentAccountData", currentAccountData);

    setCurrentAccountDetails(currentAccountData);
  }

  function handleRemoveAccount(index: any) {
    const updatedAccounts = accountsArray.filter(
      (item: any) => item.index !== index
    );

    if (updatedAccounts.length === 0) {
      router.push("/login");
      return;
    }
    setAccountsArray(updatedAccounts);
    setCurrentAccountDetails(updatedAccounts[0]);
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
  }

  function handleAddNewAccount() {
    function getIndex() {
      const indices = new Set(accountsArray.map((account) => account.index));
      let index = 0;
      while (indices.has(index)) {
        index += 1;
      }

      return index;
    }

    const index = getIndex();

    const seed = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/${index}'/0'`;
    console.log("path", path);
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    // Generate key pair from the derived seed
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);

    // Encode the public key in Base58
    const publicKey = bs58.encode(Buffer.from(keyPair.publicKey));

    // Encode the complete secretKey (both private and public key) in Base58
    const privateKey = bs58.encode(Buffer.from(keyPair.secretKey));

    const newAccount = {
      index: index,
      publicKey: publicKey,
      privateKey: privateKey,
    };

    setAccountsArray([...accountsArray, newAccount]);
    setCurrentAccountDetails(newAccount);
    localStorage.setItem(
      "accounts",
      JSON.stringify([...accountsArray, newAccount])
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-neutral-800 rounded-lg p-4">
      <div className="flex gap-4 overflow-x-scroll py-1 hide-scrollbar">
        {accountsArray.map((item: any, index) => (
          <div
            key={index}
            className={`bg-neutral-700 relative group shrink-0 select-none cursor-pointer w-12 h-12 flex items-center justify-center text-xl text-gray-200 font-semibold rounded-full text-center ${
              item?.index === currentAccountDetails?.index
                ? "border-2 border-purple-300"
                : ""
            }`}
            onClick={() => handleCurrentAccount(item?.index)}
          >
            A{item.index + 1}
            <CircleX
              onClick={() => handleRemoveAccount(item?.index)}
              size={16}
              fill="#d8b4fe"
              className="absolute hidden group-hover:block text-purple-900 rounded-full -top-1 -right-1"
            />
          </div>
        ))}
        <div
          onClick={() => handleAddNewAccount()}
          className="bg-neutral-700 cursor-pointer w-12 h-12 border border-dashed border-gray-400 flex items-center justify-center text-xl text-gray-200 font-semibold rounded-full text-center"
        >
          <Plus />
        </div>
      </div>
      <ShowAccountDetails
        privateKey={currentAccountDetails?.privateKey}
        publicKey={currentAccountDetails?.publicKey}
      />
    </div>
  );
}

function ShowAccountDetails({
  privateKey,
  publicKey,
}: {
  privateKey: any;
  publicKey: any;
}) {
  console.log("privateKey", privateKey, "publicKey", publicKey);
  return (
    <div className=" flex flex-col gap-6">
      {publicKey && <ShowBalance publicKey={publicKey} />}
      <div className=" flex flex-col gap-1">
        <p className=" text-gray-200">Private key</p>
        <ShowKeys keys={privateKey} />
      </div>
      <div className=" flex flex-col gap-1">
        <p className=" text-gray-200">Public key</p>
        <ShowKeys keys={publicKey} />
      </div>
    </div>
  );
}

function ShowBalance({ publicKey }: { publicKey: string }) {
  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function setBalance() {
      setIsLoading(true);

      console.log("publicKey", publicKey);
      const response = await fetch("api/getBalance", {
        method: "POST",
        body: JSON.stringify({ publicKey }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      console.log("data", data);

      setAccountBalance(data.balance);
      setIsLoading(false);
    }
    setBalance();
  }, [publicKey]);
  return (
    <div className="flex mt-4 flex-col gap-6">
      {isLoading ? (
        <LoaderCircle className=" animate-spin" />
      ) : (
        <div className="text-5xl font-semibold text-gray-100">
          ${accountBalance}
        </div>
      )}
    </div>
  );
}

function ShowKeys({ keys }: any) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex justify-between w-full gap-2 bg-neutral-700 rounded-lg">
      <div className="flex-1 py-2 px-4 rounded-l-lg overflow-hidden">
        {isVisible ? (
          <p className="overflow-x-scroll whitespace-nowrap w-full hide-scrollbar text-gray-200 text-sm h-6 flex items-center">
            {keys}
          </p>
        ) : (
          <p className="blur-sm select-none hide-scrollbar text-xl h-6 flex items-center w-full text-neutral-500">
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </p>
        )}
      </div>
      <div className="flex gap-2 py-2 px-4 rounded-r-lg bg-neutral-900/80 items-center">
        <CopyToClipboard keys={keys} />
        {!isVisible ? (
          <Eye
            size={20}
            className="cursor-pointer"
            onClick={() => setIsVisible(true)}
          />
        ) : (
          <EyeClosed
            size={20}
            className="cursor-pointer"
            onClick={() => setIsVisible(false)}
          />
        )}
      </div>
    </div>
  );
}

function CopyToClipboard({ keys }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keys);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };
  return (
    <div className=" relative">
      <ClipboardPlus
        size={20}
        onClick={() => handleCopy()}
        className="cursor-pointer"
      />
      {copied && (
        <div className="absolute text-xs bg-purple-400 text-purple-950 font-semibold -translate-x-1/2 py-1 px-2 rounded -top-11 left-1/2">
          Copied!
        </div>
      )}
    </div>
  );
}
