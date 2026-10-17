import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import Footer from '../../components/Footer';
import MyButton from '../../components/form/Button';
import InputField from '../../components/form/InputField';
import MaxHeightTextarea from '../../components/form/MaxHeightTextarea';
import Header from '../../components/Header';
import Layout, { GradientBackground } from '../../components/Layout';
import { getGlobalData, GlobalData } from '../../utils/global-data';
import { api } from '../../services/api';

interface Props {
  globalData: GlobalData;
}

const postSchema = yup.object({
  title: yup
    .string()
    .required('O título é obrigatório')
    .min(3, 'O título deve ter no mínimo 3 caracteres'),
  author: yup
    .string()
    .required('O autor é obrigatório')
    .min(2, 'O autor deve ter no mínimo 2 caracteres'),
  description: yup
    .string()
    .required('A descrição é obrigatória')
    .min(5, 'A descrição deve ter no mínimo 5 caracteres'),
  body: yup
    .string()
    .required('O conteúdo do post é obrigatório')
    .min(10, 'O conteúdo deve ter no mínimo 10 caracteres'),
});

type InsertPostFormData = yup.InferType<typeof postSchema>;

export default function InsertPost({ globalData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InsertPostFormData>({
    resolver: yupResolver(postSchema),
    defaultValues: {
      title: '',
      author: '',
      description: '',
      body: '',
    },
  });

  const onSubmit = async (data: InsertPostFormData) => {
    try {
      // Mapeia o campo `author` do formulário para a coluna `name` no Supabase
      const payload = {
        title: data.title,
        name: data.author,
        description: data.description,
        body: data.body,
      };

      await api.post('/posts', payload);
      alert('Post publicado com sucesso!');
      reset();
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      alert('Ocorreu um erro ao publicar o post. Tente novamente.');
    }
  };

  return (
    <Layout maxWidth="max-w-4xl">
      <Header name={globalData.name} />

      <article className="w-full px-6 md:px-0">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Insert Post
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-6 bg-white/40 dark:bg-black/30 backdrop-blur-lg p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl"
        >
          <InputField
            label="Título"
            placeholder="Ex: Primeiros passos com Next.js"
            error={errors.title?.message}
            {...register('title')}
          />

          <InputField
            label="Autor"
            placeholder="Ex: Diogo Oliveira"
            error={errors.author?.message}
            {...register('author')}
          />

          <InputField
            label="Descrição"
            placeholder="Ex: Um resumo breve do post..."
            error={errors.description?.message}
            {...register('description')}
          />

          <MaxHeightTextarea
            id="body"
            label="Conteúdo (Markdown / HTML)"
            placeholder="Escreva seu artigo aqui..."
            error={errors.body?.message}
            {...register('body')}
          />

          <div className="flex justify-end pt-2">
            <MyButton
              variant="primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Publicar Post'}
            </MyButton>
          </div>
        </form>
      </article>

      <Footer copyrightText={globalData.footerText} />
      <GradientBackground
        variant="large"
        className="absolute -top-32 opacity-30 dark:opacity-50"
      />
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}

export const getServerSideProps = async () => {
  const globalData = getGlobalData();
  return {
    props: {
      globalData,
    },
  };
};