import axios from 'axios';

const api = axios.create();

export const getFact = async (): Promise<string> => {
  const response = await api.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
  return response?.data?.text ? response?.data?.text : 'Well this is awkward...';
};
