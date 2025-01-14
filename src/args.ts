class Flags {
  #git_args: string = "";
  constructor() {}
  get git_args() {
    return this.#git_args;
  }
  set git_args(value: string) {
    this.#git_args = value;
  }
}

export const flags = new Flags();
