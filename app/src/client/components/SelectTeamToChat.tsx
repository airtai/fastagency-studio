import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Select from 'react-select';
import { type Chat } from 'wasp/entities';
import { SelectedModelSchema } from '../interfaces/BuildPageInterfaces';
import { CreateNewChatProps } from '../interfaces/PlaygroundPageInterface';
import NotificationBox from './NotificationBox';
import TextareaAutosize from 'react-textarea-autosize';
import { createNewChat } from 'wasp/client/operations';

const SelectTeamToChat = ({ userTeams }: any) => {
  const history = useHistory();
  const [team, setTeam] = useState('');
  const [allTeams, setAllTeams] = useState<SelectedModelSchema[] | null>(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<Record<string, any>>({});
  const [notificationErrorMessage, setNotificationErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRedirecting = useRef(false);

  const handleTeamChange = (selectedOption: { value: string; label: string } | null) => {
    setTeam(selectedOption ? selectedOption.value : '');
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || isRedirecting.current) return;

    setIsSubmitting(true);
    setFormError({});

    if (!allTeams) {
      setFormError((prev) => ({ ...prev, team: 'Please select/create a team' }));
      setIsSubmitting(false);
      return;
    }

    if (message.trim() === '') {
      setFormError((prev) => ({ ...prev, message: 'Message cannot be empty' }));
      setIsSubmitting(false);
      return;
    }

    try {
      const props: CreateNewChatProps = {
        teamName: team,
      };
      const chat: Chat = await createNewChat(props);
      isRedirecting.current = true;
      const encodedMessage = encodeURIComponent(message);
      history.push(`/playground/${chat.uuid}?initiateChatMsg=${encodedMessage}`);
    } catch (err: any) {
      setNotificationErrorMessage(`Error creating chat. Please try again later.`);
      console.log('Error: ' + err.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (userTeams && userTeams.length > 0) {
      setTeam(userTeams[0].json_str.name);
      setAllTeams(userTeams);
    }
  }, [userTeams]);

  const notificationOnClick = () => {
    setNotificationErrorMessage(null);
  };

  const options = allTeams
    ? allTeams.map((team: SelectedModelSchema) => ({
        value: team.json_str.name,
        label: team.json_str.name,
      }))
    : [];

  return (
    <div className='lg:mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'>
      <div className='w-full lg:min-w-[700px] 2xl:min-w-[1200px]'>
        <h2 className='mb-6 text-title-md2 font-semibold text-airt-primary'>Enter details to start new chat</h2>
        <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[420px] pt-7'>
          <form onSubmit={handleSubmit} className='px-6.5 py-2'>
            <label className='text-airt-primary' htmlFor='selectTeam'>
              Select Team
            </label>
            <Select
              id='selectTeam'
              options={options}
              onChange={handleTeamChange}
              className='pt-1 pb-1'
              value={options.find((option) => option.value === team) || null}
              isSearchable={true}
            />
            {formError.team && <div style={{ color: 'red' }}>{formError.team}</div>}
            <label className='mt-2  text-airt-primary inline-block' htmlFor='setSystemMessage'>
              Message
            </label>
            <TextareaAutosize
              minRows={4}
              maxRows={8}
              style={{
                lineHeight: 2,
                resize: 'none',
              }}
              id='setSystemMessage'
              className='block rounded w-full h-12 text-sm text-airt-primary bg-airt-font-base focus:outline-none focus:ring-0 focus:border-captn-light-blue'
              placeholder=''
              value={message}
              onChange={handleMessageChange}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {formError.message && (
              <div className='mt-1' style={{ color: 'red' }}>
                {formError.message}
              </div>
            )}
            <button
              className='rounded-md mt-2 px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              type='submit'
              disabled={isSubmitting || isRedirecting.current}
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
      {notificationErrorMessage && (
        <NotificationBox type='error' onClick={notificationOnClick} message={notificationErrorMessage} />
      )}
    </div>
  );
};

export default SelectTeamToChat;
