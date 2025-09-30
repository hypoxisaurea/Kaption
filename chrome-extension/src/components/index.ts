// Common components (named re-exports)
export * from "./common";

// Default exports promoted to top-level barrel
export { default as Logo } from "./common/Logo";
export { default as Button } from "./common/Button";
export { default as ContentModule } from "./common/ContentModule";
export { default as VideoInfo } from "./common/VideoInfo";
export { default as HoverOverlay } from "./common/HoverOverlay";

// Feature-level components that are useful across pages
export { default as StarRating } from "./OptionPage/StarRating";
export { default as Dropdown } from "./OptionPage/Dropdown";
export { default as Tag } from "./OptionPage/Tag";

export { default as Slogan } from "./StartPage/Slogan";
export { default as Spinner } from "./common/Spinner";
