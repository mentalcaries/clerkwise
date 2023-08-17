'use client';

import {
  User,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useProviderStore } from '@/stores/currentProviderStore';

import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ButtonLoading } from './ui/button-loading';

const formSchema = z.object({
  email: z.string().min(2).max(50).email(),
  password: z.string().min(8),
});

export default function Login() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const setUserInfo = useProviderStore((state) => state.setProviderInfo);

  const [invalidLogin, setInvalidLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email: 'devjaggernauth@gmail.com',
      password: 'password',
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    router.refresh();
  };

  const handleSignIn = async (formData: z.infer<typeof formSchema>) => {
    const { email, password } = formData;
    setInvalidLogin(false);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw Error('Invalid Login');

      const { user } = data;

      const { id: providerId } = user as User;

      const { data: practice } = await supabase
        .from('Providers')
        .select('practice, first_name, last_name')
        .eq('id', providerId);

      const [
        {
          practice: practiceId,
          first_name: providerFirstName,
          last_name: providerLastName,
        },
      ] = practice as Provider[];

      if (providerId && practiceId && providerFirstName && providerLastName) {
        setUserInfo({
          providerId,
          practiceId,
          providerFirstName,
          providerLastName,
        });
      }

      if (data.session) {
        router.push('/dashboard');
      }
    } catch (error) {
      setInvalidLogin(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-12 max-w-md p-2 justify-center mx-auto">
        {/* <Button variant="outline" onClick={handleSignUp}>
          Sign up
        </Button> */}
      </div>

      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>Physician Login</CardTitle>
          <CardDescription>Login to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSignIn)}
              className="space-y-8"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                {isLoading ? (
                  <ButtonLoading />
                ) : (
                  <Button type="submit">Login</Button>
                )}
              </CardFooter>
              <FormMessage />
            </form>
          </Form>
          <p className="text-center text-md font-medium text-destructive">
            {invalidLogin ? 'Invalid login credentials' : ''}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
