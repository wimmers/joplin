// Need to require this class instead of importing it
// to disable buggy type-checking, maybe because this
// class is undocumented.
import * as QuickActions from 'react-native-quick-actions';
import { _ } from '@joplin/lib/locale';
const { DeviceEventEmitter } = require('react-native');
import Note from '@joplin/lib/models/Note';
import { reg } from '@joplin/lib/registry';

type TData = {
	type: string;
};

export default (dispatch: Function, folderId: string) => {
	const userInfo = { url: '' };
	QuickActions.setShortcutItems([
		{ type: 'Quick notes', title: _('Quick notes'), icon: 'Compose', userInfo },
		{ type: 'Quick to-dos', title: _('Quick to-dos'), icon: 'Add', userInfo },
		{ type: 'New note', title: _('New note'), icon: 'Compose', userInfo },
		{ type: 'New to-do', title: _('New to-do'), icon: 'Add', userInfo },
	]);

	const handleQuickAction = (data: TData) => {
		if (!data) return;

		if (data.type.startsWith('New')) {
			// This dispatch is to momentarily go back to reset state, similar to what
			// happens in onJoplinLinkClick_(). Easier to just go back, then go to the
			// note since the Note screen doesn't handle reloading a different note.
			//
			// This hack is necessary because otherwise you get this problem:
			// The first time you create a note from the quick-action menu, it works
			// perfectly. But if you do it again immediately later, it re-opens the
			// page to that first note you made rather than creating an entirely new
			// note. If you navigate around enough (which I think changes the redux
			// state sufficiently or something), then it'll work again.
			dispatch({ type: 'NAV_BACK' });
			dispatch({ type: 'SIDE_MENU_CLOSE' });

			const isTodo = data.type === 'New to-do' ? 1 : 0;

			void Note.save({
				parent_id: folderId,
				is_todo: isTodo,
				// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
			}, { provisional: true }).then((newNote: any) => {
				dispatch({
					type: 'NAV_GO',
					noteId: newNote.id,
					folderId,
					routeName: 'Note',
				});
			});
		} else {
			dispatch({
				type: 'SHOW_QUICK_ITEM_UPDATE',
				showQuickItem: data.type === 'Quick to-dos' ? 'todo' : 'note',
			});
			dispatch({
				type: 'NAV_GO',
				folderId,
				routeName: 'Notes',
			});
		}

	};

	DeviceEventEmitter.addListener('quickActionShortcut', handleQuickAction);

	// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
	QuickActions.popInitialAction().then(handleQuickAction).catch((reason: any) => reg.logger().error(reason));
};

