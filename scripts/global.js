const NAV_EXPAND_BUTTON = document.getElementById('nav-expand');
const NAV_EXPAND_ICON = document.getElementById('nav-expand-icon');
const NAV = document.getElementsByTagName('nav')[0];

const NAV_EXPAND_ICONS = {
    'open': 'images/icons/close.svg',
    'closed': 'images/icons/menu.svg'
}

NAV_EXPAND_ICON.src = NAV_EXPAND_ICONS.closed;

function toggleNavbar(expanded) {
    let duration = 200;
    let icon;

    expanded = expanded ?? !NAV.classList.contains('expanded');

    if (expanded) {
        NAV.classList.add('expanded');
        icon = NAV_EXPAND_ICONS.open;
    } else {
        NAV.classList.remove('expanded');
        icon = NAV_EXPAND_ICONS.closed;
    }

    NAV_EXPAND_ICON.animate(
		[
			{ transform: 'rotateX(0)' },
			{ transform: 'rotateX(180deg)' }
		], {
			duration: duration,
			iterations: 1,
		}
	);

	setTimeout(() => NAV_EXPAND_ICON.src = icon, duration / 2)
}
