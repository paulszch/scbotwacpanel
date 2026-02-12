const fs = require('fs');
const path = require('path');

const mutedGroupsPath = path.join(__dirname, '../mutedGroups.json');

const loadMutedGroups = () => {
    try {
        if (fs.existsSync(mutedGroupsPath)) {
            const data = fs.readFileSync(mutedGroupsPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Gagal memuat mutedGroups.json:', error);
    }
    return []; 
};

const saveMutedGroups = (data) => {
    try {
        fs.writeFileSync(mutedGroupsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Gagal menyimpan mutedGroups.json:', error);
    }
};


if (!fs.existsSync(mutedGroupsPath)) {
    saveMutedGroups([]);
}

module.exports = { loadMutedGroups, saveMutedGroups };