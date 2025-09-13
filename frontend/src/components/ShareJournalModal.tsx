import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { searchUsers, shareJournalEntry } from '../utils/api';
import { User } from '../types';
import Input from './Input';
import Button from './Button';
import { useToast } from '../hooks/use-toast';

interface ShareJournalModalProps {
  journalId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareJournalModal: React.FC<ShareJournalModalProps> = ({ journalId, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  // Debounce search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      }
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setSearchResults([]);
  };

  const handleShare = async () => {
    if (!journalId || !selectedUser) return;

    setIsSharing(true);
    try {
      await shareJournalEntry(journalId, selectedUser.user_id, permission);
      toast({
        title: 'Journal Shared!',
        description: `Successfully shared with ${selectedUser.username}.`,
      });
      handleClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sharing Failed',
        description: 'Could not share the journal. Please try again.',
      });
      console.error('Failed to share journal:', error);
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleClose = () => {
    // Reset state on close
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setPermission('viewer');
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-matrix-gray border-matrix-green text-matrix-green">
        <DialogHeader>
          <DialogTitle>Share Journal Entry</DialogTitle>
          <DialogDescription>
            Search for a user to share this journal with.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Input
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedUser(null); // Clear selection when typing
            }}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-matrix-gray-dark border border-matrix-green rounded-md shadow-lg">
              {searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="p-2 hover:bg-matrix-green-dark cursor-pointer"
                  onClick={() => handleUserSelect(user)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
           <div className="flex items-center space-x-4 mt-4">
            <p className="font-bold">Permissions:</p>
            <div className='flex gap-2'>
              <Button onClick={() => setPermission('viewer')} variant={permission === 'viewer' ? 'default' : 'outline'}>
                Viewer
              </Button>
              <Button onClick={() => setPermission('editor')} variant={permission === 'editor' ? 'default' : 'outline'}>
                Editor
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleShare} disabled={!selectedUser || isSharing}>
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareJournalModal;