import { CommercetoolsConfig } from "../api";

const getLocale = (config: CommercetoolsConfig) => {
  switch (config.locale) {
    case "en-US":
      return "en";
    case "pt-BR":
      return "br";
    default:
      return config.locale; 
  }
}

export default getLocale