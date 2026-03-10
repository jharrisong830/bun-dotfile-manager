# bun-dotfile-manager

A utility to manage mapping dotfiles from your repository to your system.

## Prerequisites:
- `bun` >= 1.3.6

## Installing & Running

Start by cloning this repository. 

You can run commands from the repository itself, or build an executable for your own use.

```sh
# builds an executable in `dist/`
bun run build 
./dist/bun-dotfile-manager_PLATFORM_VERSION ...

# use the Bun runtime
bun run dev ...
```

## Usage

### Initialize a Config File

```sh
bdfm init
```

Running the above command will generate an application config file at `~/.config/bun-dotfile-manager/config.yaml` on Unix-like systems, and `~/AppData/Local/bun-dotfile-manager/config.yaml` on Windows.

This config file will just be a single-line YAML document, which tells the application where your dotfile repository is located. You can edit this file directly, or call `bdfm set-config <new_path_here>` to specify where your dotfile repository is located.

A typical config file will look as follows. You can use `{HOME}` within this path, and `bdfm` will fill in your home directory at runtime.

```yaml
# {HOME} -> /home/user
dotfile_repo_path: "{HOME}/dotfiles"
```

If this config file doesn't exist, you can specify the dotfile repository location as a CLI option. This will take precedence over the location specified in the config file, if it exists.

```sh
bdfm relink --dotfile-repo-path /home/user/dotfiles
```

This option is useful if you are setting up your dotfiles for the first time, and want to include the `bdfm` config in your dotfiles repository.

### Dotfile Marker Files

A dotfile marker file will sit in the same directory as a dotfile. It is formatted as a multi-document YAML file, with each document specifying one dotfile/folder in the current directory. For example, let's say our dotfile repo had the following structure:

```
.
├── git
│   └── .gitconfig
├── zsh
│   ├── .zshrc
│   └── .zprofile
└── nvim
    ├── init.lua
    └── ...
```

And we want these contents symlinked like this:

```
.
├── git
│   └── .gitconfig -> ~/.gitconfig
├── zsh
│   ├── .zshrc     -> ~/.zshrc
│   └── .zprofile  -> ~/.zprofile
└── nvim           -> ~/.config/nvim 
    └── ...        (^ linking a directory)
```

---

Let's start simple with the `git/` directory. Inside of `git/`, we will create a `.dotfiles` file:

```yaml
name: ".gitconfig"
location: "/home/user/.gitconfig"
```

This specifies that the `.gitconfig` file in the current directory should be symlinked to `/home/user/.gitconfig`. `name` should be the name of your file as it exists in your dotfiles repository, and `location` should be the full path of where you want to symlink that file.

---

Now, we can write a `.dotfiles` file for the `zsh/` directory. Even though there are multiple files in this directory, we only need to write **one** dotfile marker file.

This file will be a **multi-document** YAML file. We will use `---` to delimit between documents. **Each document will reference one dotfile**.

```yaml
name: ".zshrc"
location: "/home/user/.zshrc"
--- # starting a new document for the next dotfile!
name: ".zprofile"
location: "/home/user/.zprofile"
```

---

Finally, we will create a marker for the `nvim` ditectory. Neovim and some other programs might have their own **config directories**, with multiple files inside. We can **symlink the directory** as a whole, instead of specifying a symlink for each child.

An important note: since we are symlinking the *directory*, we will need to place our makrer file **at the same level**. That is, `.dotfiles` will sit alongside `nvim`, and both will share the same parent directory.

```yaml
name: "nvim"
location: "/home/user/.config/nvim"
```

---

With all of our markers created, we should now have the following structure:

```
.
├── git
│   ├── .dotfiles *
│   └── .gitconfig
├── zsh
│   ├── .dotfiles *
│   ├── .zshrc
│   └── .zprofile
├── .dotfiles *
└── nvim
    └── ...
```

### Creating Symlinks for Dotfiles

Once all of the dotfile marker files are created, we can start linking them from your repository to relevant locations on your file system! Running the following will scan your repository for markers, and then create symlinks based on your specifications:

```sh
bdfm relink
```

### Unlinking Dotfiles

By default, any existing symlinks will be removed prior to creating a new symlink. Regular files and directories will **NOT** be removed and will generate an error (to be handled later). To remove all specified dotfiles without creating new links, run the following:

```sh
bdfm unlink
```

### Format Specifiers

To make writing these files simpler, we can use a couple of **format specifiers**. You can use `{HOME}` to inject your home folder on your current system. That way, you can use these marker files across multiple systems! This is useful when switching between Windows and other systems, or if you're on a computer where you have a different username. For example:

```yaml
name: ".gitconfig"
location: "{HOME}/.gitconfig"
```

This could translate to `C:/Users/user`, or `/Users/user`, or `/home/user`, depending on what system you're using.

We can also use `{FILENAME}` to avoid retyping the name of the file and possibly making a mistake. For example, the following config will still symlink the file to `/home/user/.gitconfig`:

```yaml
name: ".gitconfig"
location: "/home/user/{FILENAME}"
```

Multiple format specifiers can be used at once.

### Platform-Specific Overrides

In each marker document, you can specify additional keys for each of the supported platforms (`linux`, `darwin` (macOS), and `win32`) to customize the behavior of dotfiles on each platform.

Some files/directories that exist in `~/.config` on Unix-like systems are instead located at `~/AppData/Local` on Windows. By default, we might want a file to be linked into `~/.config`, but we want to override this behavior for Windows:

```yaml
name: "nvim"
location: "{HOME}/.config/nvim"
# override for windows
win32:
    shouldLink: true
    location: "{HOME}/AppData/Local/nvim"
```

When running on Windows, the `nvim` directory will be linked to `~/AppData/Local/nvim`, instead of its usual location.

`shouldLink` is a **required** boolean value, indicating whether a dotfile should be linked on the given platform.

`location` is an optional string value. If a dotfile is supposed to be linked on the current system, then this location will override the default. If this value is not present, then we will fall back to the default location.

Additionally, multiple platform overrides can be specified for a dotfile:

```yaml
name: ".zshrc"
location: "{HOME}/{FILENAME}"
win32:
    shouldLink: false
linux:
    shouldLink: false

---

name: ".bashrc"
location: "{HOME}/{FILENAME}"
win32:
    shouldLink: true
    location: "{HOME}/gitbash.bashrc"
darwin:
    shouldLink: false
```


## Roadmap

- Add more detailed CLI help/usage messages
- Make error handling more consistent, rather than just allowing `throw`s
  - Could propagate up to `index.ts`, and handle from there, so long as error details are enough 
- Get confirmation instead of errors for overwriting regular files
- Implement more formal logging (outside of `console.log` and `console.error`) and exiting
- Use GitHub actions to build executables for commits, and utilize GitHub releases 