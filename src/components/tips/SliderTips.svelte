<script lang="ts">
  import emblaCarouselSvelte from "embla-carousel-svelte";
  import AutoScroll from "embla-carousel-autoplay";
  import TipItem from "./TipItem.svelte";
  import { DotIcon, GitForkIcon, StarIcon } from "lucide-svelte";
  import { BMC_LINK, CHROME_WEB_STORE_REVIEW_LINK } from "src/lib/constants";
  import { DOCS } from "src/lib/docs";
  import type { EmblaCarouselType } from "embla-carousel";
  import CoffeeIcon from "../icons/Coffee_Icon.svelte";

  const options = { loop: true };
  const plugins = [
    AutoScroll({
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      delay: 3000,
    }),
  ];

  let emblaApi = $state<EmblaCarouselType | null>(null);
  let scrollSnaps = $state<number[]>([]);
  let selectedIndex = $state(0);

  function onInit(evt: CustomEvent<EmblaCarouselType>) {
    emblaApi = evt.detail;
    scrollSnaps = emblaApi.scrollSnapList();
    emblaApi.on("select", () => {
      selectedIndex = emblaApi?.selectedScrollSnap() ?? 0;
    });
  }

  function scrollTo(index: number) {
    emblaApi?.scrollTo(index);
    const autoplay = (emblaApi?.plugins() as Record<string, { reset?: () => void }>)?.autoScroll;
    autoplay?.reset?.();
  }

  $effect(() => {
    return () => emblaApi?.destroy();
  });
</script>

<div class="embla-wrapper">
  <div class="embla" use:emblaCarouselSvelte={{ options, plugins }} onemblaInit={onInit}>
    <div class="embla__container">
      <div class="embla__slide">
        <TipItem
          href={CHROME_WEB_STORE_REVIEW_LINK}
          text="Give a 5-star review & share your feedback!"
          title="Click to rate on Chrome Web Store"
        >
          <div class="flex gap-2">
            <StarIcon class="h-5 w-5 animate-[bounce_1s_ease-in-out_infinite]" />
            <StarIcon class="h-5 w-5 animate-[bounce_0.8s_ease-in-out_infinite]" />
            <StarIcon class="h-5 w-5 animate-[bounce_0.6s_ease-in-out_infinite]" />
            <StarIcon class="h-5 w-5 animate-[bounce_0.4s_ease-in-out_infinite]" />
            <StarIcon class="h-5 w-5 animate-[bounce_0.6s_ease-in-out_infinite]" />
          </div>
        </TipItem>
      </div>

      <div class="embla__slide">
        <TipItem href={BMC_LINK} text="Motivate me to keep this extension updated!" title="Click to Buy Me a Coffee">
          <div class="animate-bounce">
            <CoffeeIcon height="40px" width="40px" />
          </div>
        </TipItem>
      </div>

      <div class="embla__slide">
        <TipItem
          href={DOCS.contributingAndIssues}
          text="Help contribute or report issues on GitHub."
          title="Click to open the GitHub docs section"
        >
          <div class="animate-pulse">
            <GitForkIcon class="h-8 w-8" />
          </div>
        </TipItem>
      </div>
    </div>
  </div>

  <div class="mt-2 flex justify-center gap-2">
    {#each scrollSnaps as _, index}
      <button
        class="btn btn-xs btn-circle {index === selectedIndex ? 'btn-info' : 'btn-ghost opacity-40'}"
        onclick={() => scrollTo(index)}
        aria-label="Go to slide {index + 1}"
      >
        <DotIcon />
      </button>
    {/each}
  </div>
</div>

<style>
  .embla-wrapper {
    position: relative;
    width: 100%;
    margin: 0 auto;
  }

  .embla {
    overflow: hidden;
    width: 100%;
  }

  .embla__container {
    display: flex;
  }

  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
