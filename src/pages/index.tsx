import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";

import {
  Card,
  CardHeader,
  CardBody,
  Image,
  Button,
  CardFooter,
} from "@heroui/react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { CodeWindow } from "@/components/ui/code-window";
import { TerminalOutput } from "@/components/ui/terminal-output";

export default function IndexPage() {
  const [code, setCode] = useState('print("Hello World!")');
  const [output, setOutput] = useState("Hello World!");
  const [isLoading, setIsLoading] = useState(false);

  

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setIsLoading(true);

    // Extract the text between quotes and set as output after delay
    const match = newCode.match(/"([^"]*)"/);
    if (match) {
      setTimeout(() => {
        setOutput(match[1]);
        setIsLoading(false);
      }, 2000);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 md:pt-2">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title()}>Join digital excellence with&nbsp;</span>
          <span className={title({ color: "supnum" })}>SupNum</span>
          <div className={subtitle({ class: "mt-4" })}>
            High-level training to shape digital experts.
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href={siteConfig.links.docs}
          >
            Documentation
          </Link>
          <Link
            isExternal
            className={buttonStyles({ variant: "bordered", radius: "full" })}
            href={siteConfig.links.github}
          >
            <GithubIcon size={20} />
            GitHub
          </Link>
        </div>

        <div className="relative w-full max-w-4xl flex justify-center items-start pb-20 pt-10">
          <div className="mr-[250px] animate-float-slow">
            <CodeWindow
              title="app.py"
              code={code}
              onCodeChange={handleCodeChange}
            />
          </div>
          <div
            className="ml-[550px] mt-[200px] absolute animate-float-slow"
            style={{ animationDelay: "0.5s" }}
          >
            <TerminalOutput output={output} isLoading={isLoading} />
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6">Fast. Simple. Scalable.</h2>
            <p className="text-xl text-foreground/80 mb-8">
              Notebooks include a{" "}
              <span className="font-semibold">FREE GPU plan</span> and{" "}
              <span className="font-semibold">FREE access to IPUs!</span>
            </p>
            <div className="flex gap-4 justify-center mb-16">
              <Button
                size="lg"
                color="primary"
                variant="shadow"
                radius="full"
                className="font-semibold"
              >
                Get started →
              </Button>
              <Button
                size="lg"
                variant="bordered"
                radius="full"
                className="font-semibold"
              >
                Read documentation
              </Button>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="flex items-center justify-center gap-12 opacity-60">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-thin">+</span>
              <span className="text-xl">Galaxy</span>
            </div>
            <div className="h-8">
              <img
                src="/images/shippabo.png"
                alt="Shippabo"
                className="h-full object-contain grayscale"
              />
            </div>
            <div className="h-8">
              <img
                src="/images/stratum-ai.png"
                alt="Stratum AI"
                className="h-full object-contain grayscale"
              />
            </div>
            <div className="h-8">
              <img
                src="/images/omnyx.png"
                alt="Omnyx"
                className="h-full object-contain grayscale"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <span>
              Get started by editing{" "}
              <Code color="primary">pages/index.tsx</Code>
            </span>
          </Snippet>
        </div>

        <Card className="py-4">
          <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Daily Mix</p>
            <small className="text-default-500">12 Tracks</small>
            <h4 className="font-bold text-large">Frontend Radio</h4>
          </CardHeader>
          <CardBody className="overflow-visible py-2">
            <Image
              alt="Card background"
              className="object-cover rounded-xl"
              src="https://heroui.com/images/hero-card-complete.jpeg"
              width={270}
            />
          </CardBody>
        </Card>

        <Card isFooterBlurred className="border-none" radius="lg">
          <Image
            alt="Woman listing to music"
            className="object-cover"
            height={200}
            src="https://heroui.com/images/hero-card.jpeg"
            width={200}
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Available soon.</p>
            <Button
              className="text-tiny text-white bg-black/20"
              color="default"
              radius="lg"
              size="sm"
              variant="flat"
            >
              Notify me
            </Button>
          </CardFooter>
        </Card>
      </section>
      <ShootingStars />
      <StarsBackground />
    </DefaultLayout>
  );
}
