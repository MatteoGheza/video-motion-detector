.DEFAULT_GOAL := build

build: frontend desktop
build_onefile: frontend desktop_onefile

frontend:
	cd UI; npm run build; cd ..

desktop:
	python -m PyInstaller main.spec --noconfirm

desktop_onefile:
	python -m PyInstaller main_onefile.spec --noconfirm
