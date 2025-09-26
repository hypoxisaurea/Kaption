// Common components (named re-exports)
export * from "./common";

// Default exports promoted to top-level barrel
export { default as Logo } from "./common/Logo";
export { default as Footer } from "./common/Footer";
export { default as BlackButton } from "./common/BlackButton";
export { default as Spinner } from "./common/Spinner";

// Feature-level components that are useful across pages
export { default as StarRating } from "./OptionPage/StarRating";
export { default as Dropdown } from "./OptionPage/Dropdown";
export { default as Tag } from "./OptionPage/Tag";

export { default as Slogan } from "./StartPage/Slogan";
export { default as VideoInfo } from "./ContentPage/VideoInfo";
