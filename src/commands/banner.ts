import info from "../../info.ts";

export const banner = () => {
  return (sections: any[]): any[] => {
    return [{ body: info.banner }, ...sections];
  };
};
