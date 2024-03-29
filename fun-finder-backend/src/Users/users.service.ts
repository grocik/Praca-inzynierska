import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserHobbies } from './UsersInterfaces/users.model';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly UserModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(user: User): Promise<User> {
    if (!user.email || !user.fname || !user.lname) {
      throw new Error('Wszystkie pola są wymagane.');
    }

    user.fname = user.fname.charAt(0).toUpperCase() + user.fname.slice(1);
    user.lname = user.lname.charAt(0).toUpperCase() + user.lname.slice(1);

    if (user.password) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user = { ...user, password: hashedPassword } as User;
    }

    const createdUser = await this.UserModel.create(user);
    return createdUser.toObject() as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.UserModel.findOne({ email }).exec();
  }

  async findById(userId: string): Promise<User | null> {
    return this.UserModel.findOne({ _id: userId }).exec();
  }

  async comparePassword(
    candidatePassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  async loginUser(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string } | null> {
    const user = await this.findByEmail(email);

    if (user && (await this.comparePassword(password, user.password))) {
      const payload = { _id: user._id, email: user.email, fname: user.fname, lname: user.lname };
      const accessToken = this.jwtService.sign(payload);
      return { user, accessToken };
    }

    throw new UnauthorizedException('Nieprawidłowy adres email lub hasło');
  }

  async createGoogleUser(payload: any): Promise<User> {
    const { email, given_name, family_name } = payload;
  
    const updatedUser = await this.UserModel.findOneAndUpdate(
      { email },
      { $set: { fname: given_name, lname: family_name } },
      { new: true, upsert: true }
    ).exec();
  
    const user = await this.findByEmail(email);
  
    return user;
  }

  async updateGoogleUser(user: User, payload: any): Promise<User> {
    user.email = payload.email;
    user.fname = payload.given_name;
    user.lname = payload.family_name;

    return user.save();
  }

  async getUserDescByEmail(email: string): Promise<string | null> {
    const user = await this.UserModel.findOne({ email }).exec();
    return user ? user.description : null;
  }

  async updateUserDescByEmail(email: string, newDescription: string): Promise<User | null> {
    const user = await this.UserModel.findOneAndUpdate(
      { email },
      { $set: { description: newDescription } },
      { new: true },
    ).exec();

    return user;
  }

  async getUserAvatarByEmail(email: string): Promise<string | null> {
    const user = await this.UserModel.findOne({ email }).exec();
    return user ? user.avatar : null;
  }

  async updateUserAvatarByEmail(email: string, newAvatar: string): Promise<User | null> {
    const user = await this.UserModel.findOneAndUpdate(
      { email },
      { $set: { avatar: newAvatar } },
      { new: true },
    ).exec();

    return user;
  }

  async getUserHobbiesByEmail(email: string): Promise<UserHobbies[] | null> {
    const user = await this.UserModel.findOne({ email }).exec();
    return user ? user.hobbies : null;
  }


  async getUserHobbiesNamesByEmail(email: string): Promise<UserHobbies[] | null> {
    const user = await this.UserModel.findOne({ email }).exec();
    return user ? user.hobbiesName : null;
  }

  async updateUserHobbiesByEmail(email: string, newHobbies: UserHobbies[], newHobbiesName: UserHobbies[]): Promise<User | null> {
    const user = await this.UserModel.findOneAndUpdate(
      { email },
      { $set: { hobbies: newHobbies, hobbiesName: newHobbiesName  } },
      { new: true },
    ).exec();

    return user;
  }

  async getUserHobbiesById(_id: string): Promise<UserHobbies[] | null> {
    const user = await this.UserModel.findOne({ _id }).exec();
    return user ? user.hobbies : null;
  }

  async updateUserHobbiesById(_id: string, newHobbies: UserHobbies[]): Promise<User | null> {
    const user = await this.UserModel.findOneAndUpdate(
      { _id },
      { $set: { hobbies: newHobbies } },
      { new: true },
    ).exec();

    return user;
  }

  async findUsersByHobby(hobby: string): Promise<User[]> {
    return this.UserModel.find({ hobbies: { $all: hobby  } }).select('-password').limit(20).exec();
  }


  async searchUsersByPrefix(prefix: string): Promise<User[]> {
    const regex = new RegExp(`^${prefix}`, 'i');
    const searchedUsers = await this.UserModel.find({ $or: [{ fname: regex }, { lname: regex }] }).exec();
    return searchedUsers;
  }



  async updateUserEventsByEmail(email: string, updatedEvents: any[]): Promise<User | null> {
    try {
      const user = await this.UserModel.findOne({ email }).exec();
  
      if (!user) {
        throw new Error('Użytkownik nie istnieje.');
      }
      user.events = updatedEvents;
  
      const updatedUser = await user.save();
  
      return updatedUser;
    } catch (error) {
      console.error('Błąd aktualizacji wydarzeń użytkownika:', error);
      return null;
    }
  }

}
